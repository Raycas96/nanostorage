import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TAB_ID } from "@/core/channel";
import { patchStorage } from "@/core/patch";
import { emit } from "@/core/pubsub";
import { StorageAreaValues } from "@/types";

vi.mock("@/core/pubsub", () => ({
  emit: vi.fn(),
}));

vi.mock("@/core/channel", async () => {
  const actual = await vi.importActual<typeof import("@/core/channel")>(
    "@/core/channel",
  );
  return {
    ...actual,
    broadcast: vi.fn(),
  };
});

type ExtendedStorage = Storage & {
  setItem: (key: string, value: string, fromBroadcast?: boolean) => void;
  removeItem: (key: string, fromBroadcast?: boolean) => void;
};

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

const emitMock = vi.mocked(emit);

describe("core/patch", () => {
  let originalWindow: (typeof globalThis)["window"];

  beforeEach(() => {
    vi.clearAllMocks();

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
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("setItem emits with the correct payload and captured oldValue", () => {
    window.localStorage.setItem("k", "old");
    patchStorage(StorageAreaValues.LOCAL);

    (window.localStorage as ExtendedStorage).setItem("k", "v");

    expect(emitMock).toHaveBeenCalledOnce();
    expect(emitMock).toHaveBeenCalledWith({
      key: "k",
      newValue: "v",
      oldValue: "old",
      area: StorageAreaValues.LOCAL,
      sourceTabId: TAB_ID,
    });
  });

  it("removeItem emits with newValue: null", () => {
    patchStorage(StorageAreaValues.LOCAL);
    window.localStorage.setItem("k", "v");
    emitMock.mockClear();

    (window.localStorage as ExtendedStorage).removeItem("k");

    expect(emitMock).toHaveBeenCalledOnce();
    expect(emitMock).toHaveBeenCalledWith({
      key: "k",
      newValue: null,
      oldValue: "v",
      area: StorageAreaValues.LOCAL,
      sourceTabId: TAB_ID,
    });
  });

  it("calling patchStorage('local') twice does not double patch", () => {
    patchStorage(StorageAreaValues.LOCAL);
    patchStorage(StorageAreaValues.LOCAL);

    (window.localStorage as ExtendedStorage).setItem("k", "v");

    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it("patchStorage('session') works independently from local", () => {
    patchStorage(StorageAreaValues.LOCAL);

    window.sessionStorage.setItem("k", "v");
    expect(emitMock).not.toHaveBeenCalled();

    patchStorage(StorageAreaValues.SESSION);
    (window.sessionStorage as ExtendedStorage).setItem("k", "v2");

    expect(emitMock).toHaveBeenCalledOnce();
    expect(emitMock).toHaveBeenLastCalledWith({
      key: "k",
      newValue: "v2",
      oldValue: "v",
      area: StorageAreaValues.SESSION,
      sourceTabId: TAB_ID,
    });
  });

  it("is a silent no-op during SSR when window is undefined", () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(() => patchStorage(StorageAreaValues.LOCAL)).not.toThrow();
    expect(() => patchStorage(StorageAreaValues.SESSION)).not.toThrow();
  });
});
