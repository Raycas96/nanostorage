import { expect, test } from "@playwright/test";

test.describe("Cross-tab localStorage sync", () => {
	test("mutation in Tab A reflected in Tab B", async ({ browser }) => {
		const context = await browser.newContext();
		const tabA = await context.newPage();
		const tabB = await context.newPage();

		await tabA.goto("/tests/e2e/fixtures/app.html");
		await tabB.goto("/tests/e2e/fixtures/app.html");

		await expect(tabA.locator("#local-value")).toHaveText("null");
		await expect(tabB.locator("#local-value")).toHaveText("null");

		await tabA.click("#set-local");

		await expect(tabA.locator("#local-value")).toHaveText("dark");
		await expect(tabB.locator("#local-value")).toHaveText("dark", {
			timeout: 3000,
		});

		await context.close();
	});

	test("removal in Tab B reflected in Tab A", async ({ browser }) => {
		const context = await browser.newContext();
		const tabA = await context.newPage();
		const tabB = await context.newPage();

		await tabA.goto("/tests/e2e/fixtures/app.html");
		await tabB.goto("/tests/e2e/fixtures/app.html");

		await tabA.click("#set-local");
		await expect(tabA.locator("#local-value")).toHaveText("dark");

		await tabB.click("#remove-local");
		await expect(tabB.locator("#local-value")).toHaveText("null");
		await expect(tabA.locator("#local-value")).toHaveText("null", {
			timeout: 3000,
		});

		await context.close();
	});
});

test.describe("Cross-tab sessionStorage sync", () => {
	test("sessionStorage mutation in Tab A reflected in Tab B", async ({
		browser,
	}) => {
		const context = await browser.newContext();
		const tabA = await context.newPage();
		const tabB = await context.newPage();

		await tabA.goto("/tests/e2e/fixtures/app.html");
		await tabB.goto("/tests/e2e/fixtures/app.html");

		await expect(tabA.locator("#session-value")).toHaveText("null");
		await expect(tabB.locator("#session-value")).toHaveText("null");

		await tabA.click("#set-session");
		await expect(tabA.locator("#session-value")).toHaveText("abc");
		await expect(tabB.locator("#session-value")).toHaveText("abc", {
			timeout: 3000,
		});

		await context.close();
	});
});
