import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// exact: true — the adjacent native color picker exposes the aria-label
// "Base color — open color picker" and also matches role=textbox.
const baseInput = (page: Page) =>
  page.getByRole("textbox", { name: "Base color", exact: true });

const cards = (page: Page) => page.getByRole("article");

const card = (page: Page, n: number) =>
  page.getByRole("article", { name: `Comparison ${n}` });

const cardInput = (c: Locator) =>
  c.getByRole("textbox", { name: "Color", exact: true });

/** The single WCAG badge for a level+variant, e.g. badge(card, "AA", "normal"). */
const badge = (c: Locator, level: "AA" | "AAA", variant: "normal" | "large") => {
  const withText = c.locator("span").filter({ hasText: `${level} ${variant}` });
  // "AAA normal" contains "AA normal" as a substring, so exclude AAA when
  // looking for AA.
  return level === "AA" ? withText.filter({ hasNotText: "AAA" }) : withText;
};

test.describe("compare", () => {
  test("default load seeds dodgerblue base with two comparisons", async ({
    page,
  }) => {
    await page.goto("/compare");

    await expect(baseInput(page)).toHaveValue("#1e90ff");
    await expect(cards(page)).toHaveCount(2);
  });

  test("black base vs white and #767676 reports expected contrast and badges", async ({
    page,
  }) => {
    await page.goto("/compare?b=000000&c=ffffff,767676");

    await expect(baseInput(page)).toHaveValue("#000000");
    await expect(cards(page)).toHaveCount(2);

    // Card 1: white on black is maximal contrast; every badge passes.
    const white = card(page, 1);
    await expect(white.getByText("21.00:1")).toBeVisible();
    await expect(white.getByText("pass", { exact: true })).toHaveCount(4);

    // Card 2: #767676 on black clears 4.5:1, so AA normal passes.
    const grey = card(page, 2);
    await expect(badge(grey, "AA", "normal")).toContainText("✓");
    await expect(badge(grey, "AA", "normal")).toContainText("pass");
  });

  test("adding a color renders a new card whose valid input syncs to the URL", async ({
    page,
  }) => {
    await page.goto("/compare");
    await expect(cards(page)).toHaveCount(2);

    await page.getByRole("button", { name: "+ Add color" }).click();

    await expect(cards(page)).toHaveCount(3);
    const third = card(page, 3);
    await expect(cardInput(third)).toHaveValue("");

    await cardInput(third).fill("#ff0000");

    // Metrics render once the color parses…
    await expect(third.getByText("ΔE2000")).toBeVisible();
    await expect(third.getByText(/\d+\.\d\d:1/)).toBeVisible();
    // …and the debounced URL write includes the new hex.
    await expect(page).toHaveURL(/ff0000/);
  });

  test("removing a card drops it from the list and the URL", async ({
    page,
  }) => {
    await page.goto("/compare?b=000000&c=ffffff,767676");
    await expect(cards(page)).toHaveCount(2);

    await page.getByRole("button", { name: "Remove comparison 2" }).click();

    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/c=ffffff(&|$)/);
    await expect(page).not.toHaveURL(/767676/);
  });

  test("invalid URL entries are silently dropped", async ({ page }) => {
    await page.goto("/compare?b=1e90ff&c=ffffff,zzz,000000");

    await expect(cards(page)).toHaveCount(2);
    await expect(cardInput(card(page, 1))).toHaveValue("#ffffff");
    await expect(cardInput(card(page, 2))).toHaveValue("#000000");
  });

  test("editing the base color recomputes every card", async ({ page }) => {
    await page.goto("/compare");

    // Default card 1 is white vs dodgerblue: raw 3.2365, displayed floored
    // to "3.23:1" so the shown value never overstates a threshold.
    const white = card(page, 1);
    await expect(white.getByText("3.23:1")).toBeVisible();

    await baseInput(page).fill("#ffffff");

    // White vs white: identical colors, 1:1 contrast.
    await expect(white.getByText("1.00:1")).toBeVisible();
    // Card 2 (#111111) recomputes too — near-black on white is high contrast.
    await expect(card(page, 2).getByText(/1[6-9]\.\d\d:1/)).toBeVisible();
  });
});
