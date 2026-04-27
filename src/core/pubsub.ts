import type {
  StorageArea,
  StorageChangeEvent,
  StorageListener,
  UnsubscribeFn,
} from "./types";

const subscribers = new Map<StorageArea, Map<string, Set<StorageListener>>>();

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

export function emit(event: StorageChangeEvent): void {
  const areaSubscribers = subscribers.get(event.area);

  if (!areaSubscribers) {
    return;
  }

  const listeners = areaSubscribers.get(event.key);

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
}
