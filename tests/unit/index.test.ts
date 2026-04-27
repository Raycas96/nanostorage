import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAreaValues } from "@/types";
import type {
  StorageArea,
  StorageBroadcastMessage,
  StorageChangeEvent,
  UseNanoStorageOptions,
} from "@/types";

class MockStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.has(key) ? this.values.get(key) ?? null : null;
  }

  key(index: number): string | null {
    const keys = [...this.values.keys()];
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("core/index", () => {
  let originalWindow: (typeof globalThis)["window"];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: new MockStorage(),
        sessionStorage: new MockStorage(),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.doUnmock("@/core/channel");
    vi.doUnmock("@/core/patch");
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("initNanoStorage is idempotent and registers one broadcast listener", async () => {
    const onBroadcast = vi.fn(() => vi.fn());
    const patchStorage = vi.fn();

    vi.doMock("@/core/channel", () => ({
      TAB_ID: "test-tab",
      getChannel: vi.fn(),
      broadcast: vi.fn(),
      onBroadcast,
    }));
    vi.doMock("@/core/patch", () => ({
      patchStorage,
    }));

    const { initNanoStorage } = await import("@/core/index");

    initNanoStorage();
    initNanoStorage();
    initNanoStorage();
    initNanoStorage();
    initNanoStorage();

    expect(onBroadcast).toHaveBeenCalledTimes(1);
    expect(patchStorage).toHaveBeenCalledTimes(2);
    expect(patchStorage).toHaveBeenNthCalledWith(1, StorageAreaValues.LOCAL);
    expect(patchStorage).toHaveBeenNthCalledWith(2, StorageAreaValues.SESSION);
  });

  it("watchKey returns working unsubscribe and writeRaw triggers watchers", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { watchKey, writeRawValue } = await import("@/core/index");

    const handler = vi.fn();
    const unsubscribe = watchKey("theme", StorageAreaValues.LOCAL, handler);

    writeRawValue("theme", "dark", StorageAreaValues.LOCAL);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      key: "theme",
      newValue: "dark",
      oldValue: null,
      area: StorageAreaValues.LOCAL,
      sourceTabId: expect.any(String),
    });

    unsubscribe();
    writeRawValue("theme", "light", StorageAreaValues.LOCAL);
    expect(handler).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it("readRawValue returns null when window is unavailable", async () => {
    const { readRawValue } = await import("@/core/index");

    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(readRawValue("theme", StorageAreaValues.LOCAL)).toBeNull();
  });

  it("re-exports types and runtime values from types.ts", async () => {
    const core = await import("@/core/index");

    expect(StorageAreaValues.LOCAL).toBe(StorageAreaValues.LOCAL);
    expect(StorageAreaValues.SESSION).toBe(StorageAreaValues.SESSION);

    const areaValue: StorageArea = StorageAreaValues.LOCAL;
    const broadcastMessage: StorageBroadcastMessage = {
      key: "k",
      value: "v",
      area: areaValue,
      sourceTabId: "tab",
    };
    const event: StorageChangeEvent = {
      key: "k",
      newValue: "v2",
      oldValue: "v",
      area: areaValue,
      sourceTabId: "tab",
    };
    const options: UseNanoStorageOptions<string> = {
      area: areaValue,
      serializer: (value) => value,
      deserializer: (raw) => raw,
    };

    expect(broadcastMessage.area).toBe("local");
    expect(event.newValue).toBe("v2");
    expect(options.area).toBe("local");
  });
});
