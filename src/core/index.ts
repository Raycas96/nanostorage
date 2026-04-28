import { TAB_ID, broadcast, onBroadcast } from "./channel";
import { patchStorage } from "./patch";
import { emit } from "./pubsub";
import { subscribe } from "./pubsub";
import {
  StorageAreaValues,
  type StorageArea,
  type UnsubscribeFn,
} from "@/types";

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

  const oldValue = storage.getItem(key);
  const nativeStorageProto = Object.getPrototypeOf(storage) as Storage;

  if (value === null) {
    nativeStorageProto.removeItem.call(storage, key);
  } else {
    nativeStorageProto.setItem.call(storage, key, value);
  }

  emit({
    key,
    newValue: value,
    oldValue,
    area,
    sourceTabId: TAB_ID,
  });

  if (!fromBroadcast) {
    broadcast({
      key,
      value,
      area,
      sourceTabId: TAB_ID,
    });
  }
};

const getStorage = (area: StorageArea): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return area === StorageAreaValues.LOCAL
    ? window.localStorage
    : window.sessionStorage;
};

export function initNanoStorage(): void {
  if (initialized) {
    return;
  }

  initialized = true;
  patchStorage(StorageAreaValues.LOCAL);
  patchStorage(StorageAreaValues.SESSION);

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
