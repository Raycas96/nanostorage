import { beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAreaValues, type StorageChangeEvent } from "@/types";
import { emit, subscribe } from "@/core/pubsub";

function createEvent(
  overrides: Partial<StorageChangeEvent> = {},
): StorageChangeEvent {
  return {
    key: "theme",
    newValue: "dark",
    oldValue: "light",
    area: StorageAreaValues.LOCAL,
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

    subscribe(StorageAreaValues.LOCAL, "theme", listener);
    emit(event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);
  });

  it("does not notify a different key listener", () => {
    const listener = vi.fn();

    subscribe(StorageAreaValues.LOCAL, "theme", listener);
    emit(createEvent({ key: "user" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not notify a different area listener", () => {
    const listener = vi.fn();

    subscribe(StorageAreaValues.LOCAL, "theme", listener);
    emit(createEvent({ area: StorageAreaValues.SESSION }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe is idempotent when called twice", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(StorageAreaValues.LOCAL, "theme", listener);

    expect(() => {
      unsubscribe();
      unsubscribe();
    }).not.toThrow();

    emit(createEvent());
    expect(listener).not.toHaveBeenCalled();
  });

  it("unsubscribe stops listener from firing", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(StorageAreaValues.LOCAL, "theme", listener);

    unsubscribe();
    emit(createEvent());

    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple listeners on same key all receive the event", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const event = createEvent();

    subscribe(StorageAreaValues.LOCAL, "theme", listenerA);
    subscribe(StorageAreaValues.LOCAL, "theme", listenerB);
    emit(event);

    expect(listenerA).toHaveBeenCalledOnce();
    expect(listenerB).toHaveBeenCalledOnce();
    expect(listenerA).toHaveBeenCalledWith(event);
    expect(listenerB).toHaveBeenCalledWith(event);
  });

  it("continues notifying other listeners when one throws", () => {
    const expectedError = new Error("boom");
    const throwingListener = vi.fn(() => {
      throw expectedError;
    });
    const healthyListener = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    subscribe(StorageAreaValues.LOCAL, "theme", throwingListener);
    subscribe(StorageAreaValues.LOCAL, "theme", healthyListener);

    emit(createEvent());

    expect(throwingListener).toHaveBeenCalledOnce();
    expect(healthyListener).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      "[nanostorage] Listener threw:",
      expectedError,
    );
  });

  it("emitting with no subscribers does not throw", () => {
    expect(() =>
      emit(
        createEvent({
          key: "never-subscribed",
          area: StorageAreaValues.SESSION,
        }),
      ),
    ).not.toThrow();
  });
});
