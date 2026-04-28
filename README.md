# nanostorage (WIP)

Sub-1kb, zero-dependency, framework-agnostic storage sync for modern web apps.

`nanostorage` solves one problem precisely: make `localStorage` and `sessionStorage` reactive in the same tab and across tabs, using modern browser APIs (`BroadcastChannel`) and a React 18+ adapter based on `useSyncExternalStore`.

## Blueprint Status

- **Blueprint version:** `1.0.0-blueprint`
- **Current stage:** architecture and docs aligned to production blueprint
- **License:** MIT

## Philosophy and Scope

### In Scope

| Feature | Rationale |
|---|---|
| Sub-1kb core (gzipped) | Win on bundle size |
| Same-tab local/session listeners | Native `storage` event is incomplete |
| Cross-tab local/session sync | `BroadcastChannel` based |
| React 18+ adapter | `useSyncExternalStore` avoids tearing/hydration issues |
| SSR safety | Must not crash in Next.js/Remix/Node import paths |
| TypeScript generics | Strongly typed reads/writes |
| Auto JSON serialization | `JSON.stringify`/`JSON.parse` with safe fallback |
| Zero runtime dependencies | No utility/runtime deps |

### Out of Scope (v1 hard limits)

| Feature | Reason |
|---|---|
| IE11 / legacy polyfills | Outdated target |
| IndexedDB/cookies/cache storage | Mission creep |
| Deep merge/conflict resolution | Not a CRDT library |
| State manager patterns | Not Redux/Zustand |
| Vue/Svelte/Angular adapters | Post-MVP |
| Encryption/compression | Out of mission |
| Storage quota management | Out of mission |
| `clear()` full wipe broadcasting | Intentionally omitted in v1 |

## Repository Structure

```text
nanostorage/
├── src/
│   ├── core/
│   │   ├── types.ts
│   │   ├── channel.ts
│   │   ├── patch.ts
│   │   ├── pubsub.ts
│   │   └── index.ts
│   └── react/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── dist/
├── biome.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── CHANGELOG.md
└── README.md
```

## Installation

```bash
npm install @raycas96/nanostorage
```

## Vanilla Usage

```ts
import {
  initNanoStorage,
  watchKey,
  writeRawValue,
  removeKeyFromStorage,
} from "@raycas96/nanostorage/core";

initNanoStorage();

const unsub = watchKey("theme", "local", (event) => {
  console.log("theme changed:", event.newValue);
});

writeRawValue("theme", "dark", "local");
removeKeyFromStorage("theme", "local");
unsub();
```

## React Usage

```tsx
import { useNanoStorage } from "@raycas96/nanostorage/react";

function ThemeToggle() {
  const [theme, setTheme] = useNanoStorage<string>("theme", "light");

  return (
    <button onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}>
      Current theme: {theme}
    </button>
  );
}
```

## Session Sync Highlight

```tsx
const [token, setToken] = useNanoStorage<string>("auth-token", null, { area: "session" });
```

`sessionStorage` cross-tab sync is intentionally a first-class feature in this project.

## Scripts and Tooling

- Build: `tsup`
- Type checking: `tsc --noEmit`
- Unit tests: `vitest`
- E2E tests: `playwright`
- Lint/format: `biome`
- Versioning: `changesets`

## Bundle Size Target

```bash
gzip -c dist/core/index.js | wc -c
```

Target: `< 1024` bytes for core gzipped output.

## Contributing

Use `TODO.md` for execution tracking and `TODO.private.md` for detailed internal blueprint notes.

Contributor/agent constraints are defined in `AGENTS.MD`.

