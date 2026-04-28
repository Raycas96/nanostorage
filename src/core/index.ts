import { onBroadcast } from "./channel";
import { patchStorage } from "./patch";
import { subscribe } from "./pubsub";
import {
  emitStorageMutation,
  getStorage,
  mutateStorage,
} from "./runtime";
import type { StorageArea, UnsubscribeFn } from "./types";

let initialized = false;

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

export function watchKey(
  key: string,
  area: StorageArea,
  listener: Parameters<typeof subscribe>[2],
): UnsubscribeFn {
  initNanoStorage();
  return subscribe(area, key, listener);
}

export function readRawValue(key: string, area: StorageArea): string | null {
  const storage = getStorage(area);
  if (!storage) {
    return null;
  }

  return storage.getItem(key);
}

export function writeRawValue(
  key: string,
  value: string,
  area: StorageArea,
): void {
  initNanoStorage();
  applyMutation(area, key, value, false);
}

export function removeKeyFromStorage(key: string, area: StorageArea): void {
  initNanoStorage();
  applyMutation(area, key, null, false);
}

/** Blueprint / shorthand aliases (same behavior as `*Value` / `*FromStorage`). */
export const readRaw = readRawValue;
export const writeRaw = writeRawValue;
export const removeKey = removeKeyFromStorage;
