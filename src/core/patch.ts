import type { StorageArea } from "@/types";
import { emitStorageMutation, getStorage, mutateStorage } from "./runtime";

type PatchedRemoveItem = (key: string, fromBroadcast?: boolean) => void;
const patchedStorages = new WeakSet<Storage>();

/**
 *
 * Patch the storage area to emit storage mutations.
 * @param area the storage area to patch
 * @returns void
 */
export const patchStorage = (area: StorageArea): void => {
	const storage = getStorage(area);

	if (!storage) {
		return;
	}

	if (patchedStorages.has(storage)) {
		return;
	}

	type PatchedSetItem = (
		key: string,
		value: string,
		fromBroadcast?: boolean,
	) => void;

	const patchedSetItem: PatchedSetItem = (
		key: string,
		value: string,
		fromBroadcast = false,
	) => {
		const oldValue = mutateStorage(storage, key, value);
		emitStorageMutation(area, key, value, oldValue, fromBroadcast);
	};

	const patchedRemoveItem: PatchedRemoveItem = (
		key: string,
		fromBroadcast = false,
	) => {
		const oldValue = mutateStorage(storage, key, null);
		emitStorageMutation(area, key, null, oldValue, fromBroadcast);
	};

	Object.defineProperty(storage, "setItem", {
		value: patchedSetItem,
		configurable: true,
		writable: true,
	});

	Object.defineProperty(storage, "removeItem", {
		value: patchedRemoveItem,
		configurable: true,
		writable: true,
	});
	patchedStorages.add(storage);
};
