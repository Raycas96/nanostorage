# React manual integration app

This app is for manual verification of `useNanoStorage` in a real browser.

## Run

From the repo root, build is optional for this example: Vite and TypeScript resolve the library via `src/` aliases so `dist/` does not need to exist.

```bash
cd examples/react-app
npm install
npm run dev
```

Open two tabs with the same URL and verify:

- theme updates cross-tab
- session token updates cross-tab
- remove resets the local theme value
