import { expect, test } from "@playwright/test";

const INPUT_LABEL = "Color — oklch, hsla, rgba or hex";

// exact: true — the adjacent native color picker exposes the aria-label
// "<label> — open color picker" and also matches role=textbox.
const input = (page: import("@playwright/test").Page) =>
  page.getByRole("textbox", { name: INPUT_LABEL, exact: true });

const convertedValues = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Converted values" });

const alphaPreview = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Alpha blending preview" });

test.describe("converter", () => {
  test("typing an oklch color renders all four formats and syncs the URL", async ({
    page,
  }) => {
    await page.goto("/");

    // The default draft is already this value; clear first so the fill
    // registers as a real edit (which is what triggers the URL write).
    await input(page).fill("");
    await input(page).fill("oklch(0.7 0.15 230 / 0.5)");

    await expect(page.getByText("parsed as oklch")).toBeVisible();

    // oklch(0.7 0.15 230) is outside sRGB, so hsl/rgb/hex are gamut-mapped.
    await expect(convertedValues(page).locator("code")).toHaveText([
      "oklch(0.7 0.15 230 / 0.5)",
      "hsla(195.3, 100%, 45.7%, 0.5)",
      "rgba(0, 174, 233, 0.5)",
      "#00aee980",
    ]);

    // URL write is debounced 250ms; toHaveURL polls until it lands.
    await expect(page).toHaveURL(/c=/);
  });

  test("garbage input shows an alert while keeping the previous results", async ({
    page,
  }) => {
    await page.goto("/");
    // Default color renders results first.
    await expect(convertedValues(page)).toBeVisible();

    await input(page).fill("notacolor");

    // Filter by text: Next.js's route announcer is also role=alert.
    await expect(
      page.getByRole("alert").filter({ hasText: "Unrecognized color" }),
    ).toBeVisible();
    // Previous conversion stays on screen (dimmed).
    await expect(convertedValues(page)).toBeVisible();
    await expect(convertedValues(page).locator("code")).toHaveCount(4);
  });

  test("?c=1e90ff80 seeds the input and shows the alpha preview until the color is opaque", async ({
    page,
  }) => {
    await page.goto("/?c=1e90ff80");

    await expect(input(page)).toHaveValue("#1e90ff80");
    await expect(alphaPreview(page)).toBeVisible();
    await expect(alphaPreview(page).locator("figure")).toHaveCount(3);

    await input(page).fill("#1e90ff");

    await expect(alphaPreview(page)).toHaveCount(0);
  });

  test("URL roundtrip: typed color survives a reload", async ({ page }) => {
    await page.goto("/");

    await input(page).fill("#ff5733");
    await expect(page).toHaveURL(/c=ff5733/);

    await page.reload();

    await expect(input(page)).toHaveValue("#ff5733");
    await expect(convertedValues(page).locator("code")).toHaveText([
      /^oklch\(/,
      "hsl(10.6, 100%, 60%)",
      "rgb(255, 87, 51)",
      "#ff5733",
    ]);
  });

  test("eyedropper button is hidden when the EyeDropper API is unavailable", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      delete (window as unknown as { EyeDropper?: unknown }).EyeDropper;
    });
    await page.goto("/");

    // Wait for hydration (URL sync requires client JS) before asserting
    // absence, so we don't pass trivially against pre-hydration HTML.
    await input(page).fill("#ff5733");
    await expect(page).toHaveURL(/c=ff5733/);

    await expect(
      page.getByRole("button", { name: "Pick a color from the screen" }),
    ).toHaveCount(0);
  });

  test("eyedropper button is present in Chromium", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Pick a color from the screen" }),
    ).toBeVisible();
  });
});
