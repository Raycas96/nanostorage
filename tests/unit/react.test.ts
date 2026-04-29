import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StorageAreaValues } from "@/types";

class MockStorage implements Storage {
	private values = new Map<string, string>();

	get length(): number {
		return this.values.size;
	}

	clear(): void {
		this.values.clear();
	}

	getItem(key: string): string | null {
		return this.values.has(key) ? (this.values.get(key) ?? null) : null;
	}

	key(index: number): string | null {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

describe("react/useNanoStorage", () => {
	let originalWindow: (typeof globalThis)["window"];
	let originalActEnv: unknown;

	const getHook = async () => {
		const mod = await import("@/react");
		return mod.useNanoStorage;
	};

	beforeEach(() => {
		vi.resetModules();
		originalWindow = globalThis.window;
		originalActEnv = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: unknown })
			.IS_REACT_ACT_ENVIRONMENT;
		(
			globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
		).IS_REACT_ACT_ENVIRONMENT = true;
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
		(
			globalThis as { IS_REACT_ACT_ENVIRONMENT?: unknown }
		).IS_REACT_ACT_ENVIRONMENT = originalActEnv;
		Object.defineProperty(globalThis, "window", {
			value: originalWindow,
			configurable: true,
			writable: true,
		});
	});

	it("returns initial value and supports set/update/remove", async () => {
		const useNanoStorage = await getHook();
		let snapshot: string | null = null;
		let setValue:
			| ((value: string | ((prev: string | null) => string)) => void)
			| null = null;
		let remove: (() => void) | null = null;

		function Consumer(): null {
			const [value, set, rm] = useNanoStorage<string>("theme", "light");
			snapshot = value;
			setValue = set;
			remove = rm;
			return null;
		}

		const container = document.createElement("div");
		const root = createRoot(container);

		await act(async () => {
			root.render(React.createElement(Consumer));
		});
		expect(snapshot).toBe("light");

		await act(async () => {
			setValue?.("dark");
		});
		expect(snapshot).toBe("dark");

		await act(async () => {
			setValue?.((prev) => (prev === "dark" ? "light" : "dark"));
		});
		expect(snapshot).toBe("light");

		await act(async () => {
			remove?.();
		});
		expect(snapshot).toBe("light");

		await act(async () => {
			root.unmount();
		});
	});

	it("keeps two components in sync without context provider", async () => {
		const useNanoStorage = await getHook();
		let valueA: string | null = null;
		let valueB: string | null = null;
		let setA:
			| ((value: string | ((prev: string | null) => string)) => void)
			| null = null;

		function A(): null {
			const [value, set] = useNanoStorage<string>("theme", "light");
			valueA = value;
			setA = set;
			return null;
		}

		function B(): null {
			const [value] = useNanoStorage<string>("theme", "light");
			valueB = value;
			return null;
		}

		const container = document.createElement("div");
		const root = createRoot(container);

		await act(async () => {
			root.render(
				React.createElement(React.Fragment, null, [
					React.createElement(A, { key: "a" }),
					React.createElement(B, { key: "b" }),
				]),
			);
		});

		expect(valueA).toBe("light");
		expect(valueB).toBe("light");

		await act(async () => {
			setA?.("dark");
		});

		expect(valueA).toBe("dark");
		expect(valueB).toBe("dark");

		await act(async () => {
			root.unmount();
		});
	});

	it("scopes to session storage when area is session", async () => {
		const useNanoStorage = await getHook();
		let snapshot: string | null = null;
		let setValue:
			| ((value: string | ((prev: string | null) => string)) => void)
			| null = null;

		function Consumer(): null {
			const [value, set] = useNanoStorage<string>("theme", "light", {
				area: StorageAreaValues.SESSION,
			});
			snapshot = value;
			setValue = set;
			return null;
		}

		const container = document.createElement("div");
		const root = createRoot(container);

		await act(async () => {
			root.render(React.createElement(Consumer));
		});

		await act(async () => {
			setValue?.("dark");
		});

		expect(snapshot).toBe("dark");
		expect(window.sessionStorage.getItem("theme")).toBe('"dark"');
		expect(window.localStorage.getItem("theme")).toBeNull();

		await act(async () => {
			root.unmount();
		});
	});

	it("does not throw during SSR and returns initial server snapshot", () => {
		const run = async () => {
			const useNanoStorage = await getHook();
			const oldWindow = globalThis.window;

			Object.defineProperty(globalThis, "window", {
				value: undefined,
				configurable: true,
				writable: true,
			});

			function ServerComponent(): React.ReactElement {
				const [value] = useNanoStorage<string>("theme", "light");
				return React.createElement("div", null, value);
			}

			expect(() =>
				renderToString(React.createElement(ServerComponent)),
			).not.toThrow();
			expect(renderToString(React.createElement(ServerComponent))).toContain(
				"light",
			);

			Object.defineProperty(globalThis, "window", {
				value: oldWindow,
				configurable: true,
				writable: true,
			});
		};

		return run();
	});
});
