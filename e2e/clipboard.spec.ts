import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const readClipboard = (page: import("@playwright/test").Page) =>
  page.evaluate(() => navigator.clipboard.readText());

test.describe("clipboard", () => {
  test("Copy HEX writes the hex8 string and the button flashes Copied", async ({
    page,
  }) => {
    await page.goto("/?c=1e90ff80");

    const button = page.getByRole("button", { name: "Copy HEX value" });
    await button.click();

    expect(await readClipboard(page)).toBe("#1e90ff80");

    await expect(button).toContainText("Copied ✓");
    // Resets to "Copy" after ~1.5s.
    await expect(button).toHaveText("Copy", { timeout: 3_000 });
  });

  test("Copy RGB writes the rgba string", async ({ page }) => {
    await page.goto("/?c=1e90ff80");

    await page.getByRole("button", { name: "Copy RGB value" }).click();

    expect(await readClipboard(page)).toBe("rgba(30, 144, 255, 0.502)");
  });
});
