import { TAB_ID, broadcast } from "./channel";
import { emit } from "./pubsub";
import type { StorageArea } from "./types";

export const getStorage = (area: StorageArea): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return area === "local" ? window.localStorage : window.sessionStorage;
};

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
