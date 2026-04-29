import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	use: {
		baseURL: "http://localhost:3456",
	},
	webServer: {
		command: "python3 -m http.server 3456",
		port: 3456,
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
	],
});
