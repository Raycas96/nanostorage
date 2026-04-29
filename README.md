# nanostorage

[![npm version](https://img.shields.io/npm/v/@raycas/nanostorage.svg)](https://www.npmjs.com/package/@raycas/nanostorage)
[![bundle size core gzip](https://img.shields.io/badge/core%20gzip-997B-brightgreen)](https://www.npmjs.com/package/@raycas/nanostorage)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Tiny, zero-runtime-dependency reactivity layer for `localStorage` and `sessionStorage`.

`nanostorage` keeps storage in sync:

- in the same tab (immediate notifications),
- across tabs (via `BroadcastChannel`),
- and in React 18+ (via `useSyncExternalStore`).

## Features

- zero runtime dependencies
- SSR-safe imports and guarded browser APIs
- same-tab + cross-tab propagation
- loop protection via source tab ID
- `localStorage` and `sessionStorage` support
- React adapter for ergonomic state usage

## Installation

```bash
npm install @raycas/nanostorage
```

## Quick Start (Core)

```ts
import {
	initNanoStorage,
	readRawValue,
	removeKeyFromStorage,
	watchAll,
	watchKey,
	writeRawValue,
} from "@raycas/nanostorage/core";

initNanoStorage();

const stopThemeWatch = watchKey("theme", "local", (event) => {
	console.log("theme changed:", event.oldValue, "->", event.newValue);
});

const stopAllLocalWatch = watchAll("local", (event) => {
	console.log(`[${event.area}] ${event.key}:`, event.oldValue, "->", event.newValue);
});

writeRawValue("theme", "dark", "local");
console.log(readRawValue("theme", "local")); // "dark"
removeKeyFromStorage("theme", "local");

stopThemeWatch();
stopAllLocalWatch();
```

## React Usage

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

## How Cross-Tab Sync Works

`nanostorage` emits changes locally, then rebroadcasts them through `BroadcastChannel`.  
Other tabs apply the mutation once and do not rebroadcast it again.

```ts
watchKey("token", "session", (event) => {
	console.log("session token updated:", event.newValue);
});

writeRawValue("token", "abc", "session");
```

## SSR Safety

Importing `@raycas/nanostorage/core` and `@raycas/nanostorage/react` is safe in SSR runtimes (Next.js, Remix, Node-based rendering). Browser-only APIs (`window`, `Storage`, `BroadcastChannel`) are guarded before use.

## API Reference

### Core (`@raycas/nanostorage/core`)

| Function | Signature | Returns |
| --- | --- | --- |
| `initNanoStorage` | `() => void` | Initializes storage patching and broadcast listeners once |
| `watchKey` | `(key: string, area: "local" \| "session", listener: (event: StorageChangeEvent) => void) => () => void` | Unsubscribe function |
| `watchAll` | `(area: "local" \| "session", listener: (event: StorageChangeEvent) => void) => () => void` | Unsubscribe function for all keys in area |
| `readRawValue` | `(key: string, area: "local" \| "session") => string \| null` | Raw value or `null` |
| `writeRawValue` | `(key: string, value: string, area: "local" \| "session") => void` | Writes raw value and emits updates |
| `removeKeyFromStorage` | `(key: string, area: "local" \| "session") => void` | Removes key and emits updates |

Core types:

- `StorageArea = "local" | "session"`
- `StorageChangeEvent = { key; oldValue; newValue; area; sourceTabId }`
- `StorageBroadcastMessage = { key; value; area; sourceTabId }`
- `UseNanoStorageOptions<T> = { area?; serializer?; deserializer? }`

### React (`@raycas/nanostorage/react`)

| Function | Signature | Returns |
| --- | --- | --- |
| `useNanoStorage` | `<T>(key: string, initialValue: T, options?: UseNanoStorageOptions<T>) => [T \| null, (value: T \| ((prev: T \| null) => T)) => void, () => void]` | Tuple of value, setter, and remover |

## Browser Compatibility

| Feature | Notes |
| --- | --- |
| `BroadcastChannel` | Required for cross-tab sync, widely available in modern browsers |
| `localStorage` / `sessionStorage` | Standard Web APIs |

If `BroadcastChannel` is unavailable, same-tab reactivity still works and cross-tab propagation is skipped gracefully.

## Contributing

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
```

## License

MIT

