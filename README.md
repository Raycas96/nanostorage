# nanostorage

[![npm version](https://img.shields.io/npm/v/@raycas/nanostorage.svg)](https://www.npmjs.com/package/@raycas/nanostorage)
[![bundle size core gzip](https://img.shields.io/badge/core%20gzip-997B-brightgreen)](https://www.npmjs.com/package/@raycas/nanostorage)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Tiny, zero-runtime-dependency storage sync for modern apps.

`nanostorage` makes `localStorage` and `sessionStorage` reactive:

- in the same tab (immediate listeners),
- across tabs (via `BroadcastChannel`),
- and in React 18+ (via `useSyncExternalStore`).

## Why nanostorage

`nanostorage` focuses on three pain points:

1. **Same-tab updates:** native `storage` events do not fire in the same tab where writes happen.
2. **sessionStorage cross-tab sync:** browsers do not provide this natively; `nanostorage` normalizes it.
3. **SSR safety:** importing and using core/react APIs does not crash in server environments.

## Installation

```bash
npm install @raycas/nanostorage
```

## React Usage (TypeScript)

```tsx
import { useNanoStorage } from "@raycas/nanostorage/react";

function ThemeToggle() {
	const [theme, setTheme, removeTheme] = useNanoStorage<string>("theme", "light");

	return (
		<div>
			<p>Theme: {theme}</p>
			<button type="button" onClick={() => setTheme("dark")}>
				Dark
			</button>
			<button type="button" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
				Toggle
			</button>
			<button type="button" onClick={removeTheme}>
				Reset
			</button>
		</div>
	);
}
```

Use session area:

```tsx
const [token, setToken] = useNanoStorage<string | null>("auth-token", null, {
	area: "session",
});
```

## Vanilla Usage (TypeScript)

```ts
import {
	initNanoStorage,
	readRawValue,
	removeKeyFromStorage,
	watchKey,
	writeRawValue,
} from "@raycas/nanostorage/core";

initNanoStorage();

const unsubscribe = watchKey("theme", "local", (event) => {
	console.log("theme changed", event.oldValue, "->", event.newValue);
});

writeRawValue("theme", "dark", "local");
console.log(readRawValue("theme", "local")); // "dark"
removeKeyFromStorage("theme", "local");

unsubscribe();
```

## sessionStorage Cross-Tab Sync

`sessionStorage` sync across tabs is a first-class behavior in this library.

```ts
watchKey("token", "session", (event) => {
	console.log("session token updated:", event.newValue);
});
```

When one tab writes with:

```ts
writeRawValue("token", "abc", "session");
```

other tabs on the same origin receive exactly one update (loop-protected by source tab ID).

## SSR

`nanostorage` is safe to import in SSR runtimes (Next.js, Remix, Node-based rendering).  
Browser-only APIs (`window`, `Storage`, `BroadcastChannel`) are guarded before use.

## API Reference

### Core (`@raycas/nanostorage/core`)

| Function | Signature | Returns |
| --- | --- | --- |
| `initNanoStorage` | `() => void` | Initializes storage patching and broadcast listeners once |
| `watchKey` | `(key: string, area: "local" \| "session", listener: (event: StorageChangeEvent) => void) => () => void` | Unsubscribe function |
| `readRawValue` | `(key: string, area: "local" \| "session") => string \| null` | Raw value or `null` |
| `writeRawValue` | `(key: string, value: string, area: "local" \| "session") => void` | Writes raw value + emits updates |
| `removeKeyFromStorage` | `(key: string, area: "local" \| "session") => void` | Removes key + emits updates |

Core types:

- `StorageArea = "local" | "session"`
- `StorageChangeEvent = { key; oldValue; newValue; area; sourceTabId }`
- `StorageBroadcastMessage = { key; value; area; sourceTabId }`
- `UseNanoStorageOptions<T> = { area?; serializer?; deserializer? }`

### React (`@raycas/nanostorage/react`)

| Function | Signature | Returns |
| --- | --- | --- |
| `useNanoStorage` | `<T>(key: string, initialValue: T, options?: UseNanoStorageOptions<T>) => [T \| null, (value: T \| ((prev: T \| null) => T)) => void, () => void]` | Tuple of current value, setter, and remover |

## Browser Compatibility

`nanostorage` depends on `BroadcastChannel` for cross-tab messaging.

| Feature | Baseline |
| --- | --- |
| `BroadcastChannel` | Widely available in modern browsers (baseline around 2022) |
| `localStorage` / `sessionStorage` | Standard web platform APIs |

If `BroadcastChannel` is unavailable, same-tab reactivity still works; cross-tab sync is skipped gracefully.

## License

MIT

