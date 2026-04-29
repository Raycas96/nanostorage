# AGENTS Guide

This repository follows the `nanostorage` **Complete Production Blueprint v1.0.0**.

This file is the execution contract for contributors and coding agents.

## Mission

Build a precision micro-library that makes `localStorage` and `sessionStorage` reactive:
- in the same tab,
- across tabs via `BroadcastChannel`,
- with a React 18+ adapter based on `useSyncExternalStore`,
- with zero runtime dependencies.

## Priority Order

1. Behavioral correctness
2. SSR safety and deterministic fallbacks
3. Bundle size (<1kb core gz target)
4. API ergonomics
5. Feature expansion

## Scope Controls

### In Scope

- `src/core` runtime (`types.ts`, `channel.ts`, `patch.ts`, `pubsub.ts`, `index.ts`)
- `src/react` adapter (`useNanoStorage`)
- unit and e2e tests
- TypeScript strictness and zero-runtime-deps guarantees

### Out of Scope (hard limits)

- legacy polyfills (IE11-era support)
- state-management features (reducers/actions/stores)
- non-storage persistence backends (IndexedDB/cookies/cache)
- deep merge/conflict engines
- non-React framework adapters in v1
- encryption/compression/quota management features
- `clear()` full wipe broadcasting in v1

## Architecture Rules

- Keep core and React adapter in separate entry points.
- Never import React into `src/core`.
- `BroadcastChannel` access must be guarded and lazy.
- Patching logic must be idempotent (no double patch side effects).
- Cross-tab handling must prevent rebroadcast loops via tab/source ID.

## API and Behavior Guarantees

- same-tab `setItem`/`removeItem` must notify listeners immediately
- cross-tab updates must propagate exactly once
- key scoping must be exact (`area + key`)
- listener unsubscribe must be idempotent
- serialization/deserialization failures must degrade safely
- SSR import path must never throw

## Testing Requirements

Any behavior change requires tests.

Minimum coverage expectation:
- `tests/unit/pubsub.test.ts`
- `tests/unit/patch.test.ts`
- `tests/unit/channel.test.ts`
- `tests/e2e/sync.spec.ts`

Critical assertions:
- same-tab notifications work
- cross-tab propagation works
- loop prevention works
- SSR safety holds
- adapter snapshot behavior remains stable

## Tooling Contract

- Build: `tsdown`
- Type check: `tsc --noEmit`
- Lint/format: `biome`
- Unit tests: `vitest`
- E2E tests: `playwright`
- Release/versioning: `changesets`

## Documentation Contract

When public API or behavior changes:
- update `README.md` examples and constraints
- update `TODO.md` execution state
- update `TODO.private.md` blueprint notes if architecture changes
- add changelog notes when release semantics are affected

## Workflow

1. Read `README.md`, `TODO.md`, and `TODO.private.md`.
2. Implement the smallest complete change.
3. Run lint/tests for touched areas.
4. Update docs in same PR.
5. Report behavior changes + verification evidence.

## Change Hygiene

- Keep PRs focused.
- Avoid scope creep.
- Do not use destructive git commands.
- Preserve unrelated user changes in dirty trees.

## Pre-Completion Checklist

- [ ] Scope remains within v1 blueprint
- [ ] Core remains runtime dependency-free
- [ ] SSR-safe guards validated
- [ ] Tests updated and passing
- [ ] README and TODO files aligned

