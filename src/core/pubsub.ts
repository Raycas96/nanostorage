import type {
	StorageArea,
	StorageChangeEvent,
	StorageListener,
	UnsubscribeFn,
} from "@/types";

const subscribers = new Map<StorageArea, Map<string, Set<StorageListener>>>();
const ALL_KEYS = "*";

/**
 *
 * Get the listeners for a key in a storage area.
 * @param area the storage area to get listeners for
 * @param key the key to get listeners for
 * @returns a set of listeners
 */
const getListeners = (area: StorageArea, key: string): Set<StorageListener> => {
	let areaSubscribers = subscribers.get(area);
	if (!areaSubscribers) {
		areaSubscribers = new Map<string, Set<StorageListener>>();
		subscribers.set(area, areaSubscribers);
	}

	let listeners = areaSubscribers.get(key);
	if (!listeners) {
		listeners = new Set<StorageListener>();
		areaSubscribers.set(key, listeners);
	}

	return listeners;
};

/**
 *
 * Subscribe to a key in a storage area for changes.
 * @param area the storage area to subscribe to
 * @param key the key to subscribe to
 * @param listener the listener to call when the key is changed
 * @returns a function to unsubscribe from the subscription
 */
export const subscribe = (
	area: StorageArea,
	key: string,
	listener: StorageListener,
): UnsubscribeFn => {
	const listeners = getListeners(area, key);
	listeners.add(listener);

	let unsubscribed = false;

	return () => {
		if (unsubscribed) {
			return;
		}

		unsubscribed = true;
		listeners.delete(listener);

		if (listeners.size === 0) {
			const areaSubscribers = subscribers.get(area);
			areaSubscribers?.delete(key);

			if (areaSubscribers && areaSubscribers.size === 0) {
				subscribers.delete(area);
			}
		}
	};
};

/**
 *
 * Subscribe to all keys in a storage area for changes.
 * @param area the storage area to subscribe to
 * @param listener the listener to call when any key is changed
 * @returns a function to unsubscribe from the subscription
 */
export const subscribeAll = (
	area: StorageArea,
	listener: StorageListener,
): UnsubscribeFn => subscribe(area, ALL_KEYS, listener);

/**
 *
 * Emit a storage change event to all subscribers.
 * @param event the event to emit
 * @returns void
 */
export const emit = (event: StorageChangeEvent): void => {
	const areaSubscribers = subscribers.get(event.area);

	if (!areaSubscribers) {
		return;
	}

	const listeners = new Set<StorageListener>();
	const keyListeners = areaSubscribers.get(event.key);
	const wildcardListeners = areaSubscribers.get(ALL_KEYS);

	if (keyListeners) {
		for (const listener of keyListeners) {
			listeners.add(listener);
		}
	}

	if (wildcardListeners) {
		for (const listener of wildcardListeners) {
			listeners.add(listener);
		}
	}

	if (!listeners || listeners.size === 0) {
		return;
	}

	// Iterate a snapshot to avoid mutation-during-iteration issues.
	for (const listener of [...listeners]) {
		try {
			listener(event);
		} catch (err) {
			console.error("[nanostorage] Listener threw:", err);
		}
	}
};
