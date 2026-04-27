export type StorageArea = "local" | "session";

export interface StorageBroadcastMessage {
  key: string;
  value: string | null;
  area: StorageArea;
  sourceTabId: string;
}

export interface StorageChangeEvent {
  key: string;
  newValue: string | null;
  oldValue: string | null;
  area: StorageArea;
  sourceTabId: string;
}

export type StorageListener = (event: StorageChangeEvent) => void;

export type UnsubscribeFn = () => void;

export interface UseNanoStorageOptions<T> {
  area?: StorageArea;
  serializer?: (value: T) => string;
  deserializer?: (raw: string) => T | null;
}
