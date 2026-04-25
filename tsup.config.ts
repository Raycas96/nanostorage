import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/core/index.ts" },
    outDir: "dist/core",
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    treeshake: true,
    target: "es2020",
  },
  {
    entry: { index: "src/react/index.ts" },
    outDir: "dist/react",
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
    target: "es2020",
    external: ["react", "react-dom"],
  },
]);
