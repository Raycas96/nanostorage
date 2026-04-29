import { beforeEach, describe, expect, it, vi } from "vitest";
import { emit, subscribe, subscribeAll } from "@/core/pubsub";
import { StorageAreaValues, type StorageChangeEvent } from "@/types";

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

	it("subscribeAll notifies for every key in the same area", () => {
		const listener = vi.fn();
		const firstEvent = createEvent({ key: "theme" });
		const secondEvent = createEvent({ key: "user" });

		subscribeAll(StorageAreaValues.LOCAL, listener);
		emit(firstEvent);
		emit(secondEvent);

		expect(listener).toHaveBeenCalledTimes(2);
		expect(listener).toHaveBeenNthCalledWith(1, firstEvent);
		expect(listener).toHaveBeenNthCalledWith(2, secondEvent);
	});

	it("subscribeAll does not notify for a different area", () => {
		const listener = vi.fn();

		subscribeAll(StorageAreaValues.LOCAL, listener);
		emit(createEvent({ area: StorageAreaValues.SESSION }));

		expect(listener).not.toHaveBeenCalled();
	});

	it("subscribeAll unsubscribe is idempotent", () => {
		const listener = vi.fn();
		const unsubscribe = subscribeAll(StorageAreaValues.LOCAL, listener);

		expect(() => {
			unsubscribe();
			unsubscribe();
		}).not.toThrow();

		emit(createEvent());
		expect(listener).not.toHaveBeenCalled();
	});

	it("deduplicates notifications when same listener is on key and wildcard", () => {
		const listener = vi.fn();

		subscribe(StorageAreaValues.LOCAL, "theme", listener);
		subscribeAll(StorageAreaValues.LOCAL, listener);
		emit(createEvent({ key: "theme" }));

		expect(listener).toHaveBeenCalledOnce();
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
