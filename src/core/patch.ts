import { TAB_ID, broadcast } from "./channel";
import { emit } from "./pubsub";
import { StorageAreaValues, type StorageArea } from "@/types";

type PatchedSetItem = (
  key: string,
  value: string,
  fromBroadcast?: boolean,
) => void;
type PatchedRemoveItem = (key: string, fromBroadcast?: boolean) => void;
const patchedStorages = new WeakSet<Storage>();

const getStorage = (area: StorageArea): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (area === StorageAreaValues.LOCAL) {
    return window.localStorage;
  } else if (area === StorageAreaValues.SESSION) {
    return window.sessionStorage;
  }

  return null;
};

export const patchStorage = (area: StorageArea): void => {
  if (typeof window === "undefined") {
    return;
  }

  const storage = getStorage(area);

  if (!storage) {
    return;
  }

  if (patchedStorages.has(storage)) {
    return;
  }

  const originalSetItem = storage.setItem.bind(storage);
  const originalRemoveItem = storage.removeItem.bind(storage);

  const patchedSetItem: PatchedSetItem = (
    key: string,
    value: string,
    fromBroadcast = false,
  ) => {
    const oldValue = storage.getItem(key);
    originalSetItem(key, value);

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

  const patchedRemoveItem: PatchedRemoveItem = (
    key: string,
    fromBroadcast = false,
  ) => {
    const oldValue = storage.getItem(key);
    originalRemoveItem(key);

    emit({
      key,
      newValue: null,
      oldValue,
      area,
      sourceTabId: TAB_ID,
    });

    if (!fromBroadcast) {
      broadcast({
        key,
        value: null,
        area,
        sourceTabId: TAB_ID,
      });
    }
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
