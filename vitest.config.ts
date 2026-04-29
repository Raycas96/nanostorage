import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "happy-dom",
		globals: true,
		include: ["tests/unit/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/**"],
			thresholds: {
				lines: 90,
				functions: 90,
			},
		},
	},
});
