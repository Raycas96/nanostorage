import type { StorageArea, UnsubscribeFn } from "@/types";
import { onBroadcast } from "./channel";
import { patchStorage } from "./patch";
import { subscribe, subscribeAll } from "./pubsub";
import { emitStorageMutation, getStorage, mutateStorage } from "./runtime";

/**
 * this variabile is used to track if the nano storage has been initialized
 * to avoid initializing the nano storage multiple times
 */
let initialized = false;

/**
 *
 * @param area the storage area to apply the mutation to
 * @param key the key to apply the mutation to
 * @param value the value to apply the mutation to
 * @param fromBroadcast whether the mutation is from a broadcast
 * @returns void
 */
const applyMutation = (
	area: StorageArea,
	key: string,
	value: string | null,
	fromBroadcast: boolean,
): void => {
	const storage = getStorage(area);

	if (!storage) {
		return;
	}

	const oldValue = mutateStorage(storage, key, value);
	emitStorageMutation(area, key, value, oldValue, fromBroadcast);
};

/**
 *
 * Initialize the nano storage.
 * @returns void
 */
export function initNanoStorage(): void {
	if (initialized) {
		return;
	}

	initialized = true;
	patchStorage("local");
	patchStorage("session");

	onBroadcast((message) => {
		applyMutation(message.area, message.key, message.value, true);
	});
}

/**
 * Watch a key in a storage area for changes.
 * @param key
 * @param area
 * @param listener
 * @returns Unsubscribe function
 */
export function watchKey(
	key: string,
	area: StorageArea,
	listener: Parameters<typeof subscribe>[2],
): UnsubscribeFn {
	initNanoStorage();
	return subscribe(area, key, listener);
}

/**
 * Watch all keys in a storage area for changes.
 * @param area
 * @param listener
 * @returns Unsubscribe function
 */
export function watchAll(
	area: StorageArea,
	listener: Parameters<typeof subscribeAll>[1],
): UnsubscribeFn {
	initNanoStorage();
	return subscribeAll(area, listener);
}

/**
 * Read a raw value from a storage area.
 * @param key the key to read
 * @param area the storage area to read from
 * @returns Raw value or null if the storage is not available
 */
export function readRawValue(key: string, area: StorageArea): string | null {
	const storage = getStorage(area);
	if (!storage) {
		return null;
	}

	return storage.getItem(key);
}

/**
 *
 * @param key the key to write
 * @param value the value to write
 * @param area the storage area to write to
 * @returns void
 */
export function writeRawValue(
	key: string,
	value: string,
	area: StorageArea,
): void {
	initNanoStorage();
	applyMutation(area, key, value, false);
}

/**
 *
 * @param key the key to remove
 * @param area the storage area to remove from
 * @returns void
 */
export function removeKeyFromStorage(key: string, area: StorageArea): void {
	initNanoStorage();
	applyMutation(area, key, null, false);
}
