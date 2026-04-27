import { onBroadcast } from "./channel";
import { patchStorage } from "./patch";
import { subscribe } from "./pubsub";
import {
  StorageAreaValues,
  type StorageArea,
  type UnsubscribeFn,
} from "@/types";

type PatchedStorageSetItem = (
  key: string,
  value: string,
  fromBroadcast?: boolean,
) => void;
type PatchedStorageRemoveItem = (key: string, fromBroadcast?: boolean) => void;

let initialized = false;

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
    const storage = getStorage(message.area);
    if (!storage) {
      return;
    }

    if (message.value === null) {
      (storage.removeItem as PatchedStorageRemoveItem)(message.key, true);
    } else {
      (storage.setItem as PatchedStorageSetItem)(
        message.key,
        message.value,
        true,
      );
    }
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

export function readRawValue<T>(key: string, area: StorageArea): string | null {
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
  const storage = getStorage(area);
  if (!storage) {
    return;
  }

  (storage.setItem as PatchedStorageSetItem)(key, value);
}

export function removeKeyFromStorage(key: string, area: StorageArea): void {
  initNanoStorage();
  const storage = getStorage(area);
  if (!storage) {
    return;
  }

  (storage.removeItem as PatchedStorageRemoveItem)(key);
}
