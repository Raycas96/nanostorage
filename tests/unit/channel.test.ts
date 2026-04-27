import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAreaValues, type StorageBroadcastMessage } from "@/types";
import { getChannel } from "@/core/channel";

type MessageListener = (event: MessageEvent<StorageBroadcastMessage>) => void;

class MockBroadcastChannel {
  public static instances: MockBroadcastChannel[] = [];

  private listeners = new Set<MessageListener>();

  constructor(public readonly name: string) {
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(_message: StorageBroadcastMessage): void {
    // no-op for these unit tests
  }

  addEventListener(_type: "message", listener: MessageListener): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "message", listener: MessageListener): void {
    this.listeners.delete(listener);
  }

  emit(message: StorageBroadcastMessage): void {
    const event = { data: message } as MessageEvent<StorageBroadcastMessage>;
    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }
}

describe("core/channel", () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  beforeEach(() => {
    vi.resetModules();
    MockBroadcastChannel.instances = [];
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
    vi.restoreAllMocks();
  });

  it("returns the same channel instance on multiple getChannel calls", async () => {
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;

    const first = getChannel();
    const second = getChannel();

    expect(first).toBeTruthy();
    expect(first).toBe(second);
    expect(MockBroadcastChannel.instances).toHaveLength(1);
  });

  it("returns null when BroadcastChannel is unavailable", async () => {
    globalThis.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;
    const { getChannel } = await import("../../src/core/channel");

    expect(getChannel()).toBeNull();
  });

  it("ignores self messages and handles foreign messages", async () => {
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    const { TAB_ID, onBroadcast, getChannel } = await import("../../src/core/channel");

    const handler = vi.fn();
    const unsubscribe = onBroadcast(handler);
    const channel = getChannel() as unknown as MockBroadcastChannel;

    channel.emit({
      key: "theme",
      value: "dark",
      area: StorageAreaValues.LOCAL,
      sourceTabId: TAB_ID,
    });
    expect(handler).not.toHaveBeenCalled();

    const foreignMessage: StorageBroadcastMessage = {
      key: "theme",
      value: "light",
      area: StorageAreaValues.LOCAL,
      sourceTabId: "other-tab",
    };
    channel.emit(foreignMessage);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(foreignMessage);

    unsubscribe();
  });

  it("cleanup removes listener so handler no longer fires", async () => {
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    const { onBroadcast, getChannel } = await import("../../src/core/channel");

    const handler = vi.fn();
    const unsubscribe = onBroadcast(handler);
    const channel = getChannel() as unknown as MockBroadcastChannel;

    unsubscribe();
    channel.emit({
      key: "theme",
      value: "dark",
      area: StorageAreaValues.LOCAL,
      sourceTabId: "other-tab",
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
