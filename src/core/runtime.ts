import { TAB_ID, broadcast } from "./channel";
import { emit } from "./pubsub";
import { StorageArea, StorageAreaValues } from "@/types";

/**
 *
 * @param area the storage area to get
 * @returns the storage or null if the window is not defined
 */
export const getStorage = (area: StorageArea): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (area === StorageAreaValues.LOCAL) {
    return window.localStorage;
  }

  if (area === StorageAreaValues.SESSION) {
    return window.sessionStorage;
  }

  return null;
};

/**
 *
 * @param storage the storage to mutate
 * @param key the key to mutate
 * @param value the value to mutate the key to
 * @returns the old value of the key
 */
export const mutateStorage = (
  storage: Storage,
  key: string,
  value: string | null,
): string | null => {
  const oldValue = storage.getItem(key);
  const nativeStorageProto = Object.getPrototypeOf(storage) as Storage;

  if (value === null) {
    nativeStorageProto.removeItem.call(storage, key);
  } else {
    nativeStorageProto.setItem.call(storage, key, value);
  }

  return oldValue;
};

/**
 *
 * @param area the storage area to emit the mutation from
 * @param key the key that was mutated
 * @param newValue the new value of the key
 * @param oldValue the old value of the key
 * @param fromBroadcast
 * @returns void whether the mutation is from a broadcast
 */
export const emitStorageMutation = (
  area: StorageArea,
  key: string,
  newValue: string | null,
  oldValue: string | null,
  fromBroadcast: boolean,
): void => {
  emit({
    key,
    newValue,
    oldValue,
    area,
    sourceTabId: TAB_ID,
  });

  if (!fromBroadcast) {
    broadcast({
      key,
      value: newValue,
      area,
      sourceTabId: TAB_ID,
    });
  }
};
