import { useCallback, useSyncExternalStore } from "react";

import {
  StorageAreaValues,
  type StorageListener,
  type UseNanoStorageOptions,
} from "@/types";

import {
  initNanoStorage,
  readRaw,
  removeKey,
  watchKey,
  writeRaw,
} from "@/core";

type SetValueAction<T> = T | ((prev: T | null) => T);
type SetValueFn<T> = (value: SetValueAction<T>) => void;

const defaultSerializer = <T>(value: T): string => JSON.stringify(value);

const defaultDeserializer = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/**
 * React hook to use nanostorage.
 * @param key - The key to use for the storage.
 * @param initialValue - The initial value to use for the storage.
 * @param options - The options to use for the storage.
 * @returns The value, set value function, and remove function.
 */
export function useNanoStorage<T>(
  key: string,
  initialValue: T,
  options: UseNanoStorageOptions<T> = {},
): [T | null, SetValueFn<T>, () => void] {
  const area = options.area ?? StorageAreaValues.LOCAL;
  const serializer = options.serializer ?? defaultSerializer<T>;
  const deserializer = options.deserializer ?? defaultDeserializer<T>;

  initNanoStorage();

  const getSnapshot = (): T | null => {
    const raw = readRaw(key, area);
    if (raw === null) {
      return initialValue;
    }

    const value = deserializer(raw);
    return value === null ? initialValue : value;
  };

  const getServerSnapshot = (): T | null => initialValue;

  const subscribe = (onStoreChange: () => void): (() => void) => {
    const listener: StorageListener = () => {
      onStoreChange();
    };
    return watchKey(key, area, listener);
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue: SetValueFn<T> = useCallback(
    (nextValueOrUpdater) => {
      const rawPrev = readRaw(key, area);
      const prev =
        rawPrev === null
          ? initialValue
          : (deserializer(rawPrev) ?? initialValue);
      const nextValue =
        typeof nextValueOrUpdater === "function"
          ? (nextValueOrUpdater as (prev: T | null) => T)(prev)
          : nextValueOrUpdater;

      try {
        const raw = serializer(nextValue);
        writeRaw(key, raw, area);
      } catch {
        console.error(
          `Failed to serialize value for key ${key} in area ${area}`,
        );
      }
    },
    [key, area, serializer, deserializer, initialValue],
  );

  const remove = useCallback((): void => {
    removeKey(key, area);
  }, [key, area]);

  return [value, setValue, remove];
}
