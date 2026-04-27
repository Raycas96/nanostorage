import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StorageChangeEvent } from "@core/types";
import { emit, subscribe } from "@/core/pubsub";

function createEvent(
  overrides: Partial<StorageChangeEvent> = {},
): StorageChangeEvent {
  return {
    key: "theme",
    newValue: "dark",
    oldValue: "light",
    area: "local",
    sourceTabId: "tab-a",
    ...overrides,
  };
}

describe("core/pubsub", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls listener with the correct StorageChangeEvent payload", () => {
    const listener = vi.fn();
    const event = createEvent();

    subscribe("local", "theme", listener);
    emit(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);
  });

  it("does not notify a different key listener", () => {
    const listener = vi.fn();

    subscribe("local", "theme", listener);
    emit(createEvent({ key: "user" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify a different area listener", () => {
    const listener = vi.fn();

    subscribe("local", "theme", listener);
    emit(createEvent({ area: "session" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe is idempotent when called twice", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe("local", "theme", listener);

    expect(() => {
      unsubscribe();
      unsubscribe();
    }).not.toThrow();

    emit(createEvent());
    expect(listener).not.toHaveBeenCalled();
  });

  it("continues notifying other listeners when one throws", () => {
    const expectedError = new Error("boom");
    const throwingListener = vi.fn(() => {
      throw expectedError;
    });
    const healthyListener = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    subscribe("local", "theme", throwingListener);
    subscribe("local", "theme", healthyListener);

    emit(createEvent());

    expect(throwingListener).toHaveBeenCalledOnce();
    expect(healthyListener).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      "[nanostorage] Listener threw:",
      expectedError,
    );
  });
});
