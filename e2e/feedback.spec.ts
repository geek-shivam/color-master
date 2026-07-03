import { expect, test } from "@playwright/test";

test.describe("comparison feedback round", () => {
  test("alpha slider preserves the typed color format", async ({ page }) => {
    await page.goto("/compare");
    const card = page.getByRole("article", { name: "Comparison 1" });

    await card.getByRole("textbox", { name: "Color", exact: true }).fill(
      "hsl(120 100% 37%)",
    );
    await expect(page).toHaveURL(/c=00bd00/);

    await card.getByLabel("Color — alpha", { exact: true }).fill("0.35");

    await expect(card.getByRole("textbox", { name: "Color", exact: true })).toHaveValue(
      "hsla(120, 100%, 37%, 0.35)",
    );
    await expect(page).toHaveURL(/c=00bd0059/);
  });

  test("a translucent twin of the base registers in every metric", async ({ page }) => {
    // Regression: base vs the same color at alpha 0.35 must NOT read as identical.
    await page.goto("/compare?b=00bd00&c=00bd0059");
    const card = page.getByRole("article", { name: "Comparison 1" });
    const dds = card.locator("dd");

    await expect(dds.nth(0)).not.toHaveText(/^0\.00/); // ΔE2000
    await expect(dds.nth(1)).not.toHaveText("0.000"); // OKLCH Δ
    await expect(dds.nth(2)).not.toHaveText("1.00:1"); // contrast
  });

  test("all four formats are visible on cards and base without any toggle", async ({
    page,
  }) => {
    await page.goto("/compare");
    const card = page.getByRole("article", { name: "Comparison 1" });

    for (const label of ["OKLCH", "HSL", "RGB", "HEX"]) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText("All formats")).toHaveCount(0);

    const baseSection = page.getByRole("region", { name: "Base color" });
    for (const label of ["OKLCH", "HSL", "RGB", "HEX"]) {
      await expect(baseSection.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("per-card backdrop switch changes the metrics for translucent colors", async ({
    page,
  }) => {
    await page.goto("/compare?b=1e90ff&c=00000080");
    const card = page.getByRole("article", { name: "Comparison 1" });
    const contrast = card.locator("dd").nth(2);
    const overWhite = await contrast.innerText();

    await card.getByRole("button", { name: "Black backdrop" }).click();

    await expect(contrast).not.toHaveText(overWhite);
    await expect(
      card.getByRole("button", { name: "Black backdrop" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("base swatch has its own backdrop switch", async ({ page }) => {
    await page.goto("/compare");
    const baseSection = page.getByRole("region", { name: "Base color" });

    const whiteButton = baseSection.getByRole("button", { name: "White backdrop" });
    await whiteButton.click();
    await expect(whiteButton).toHaveAttribute("aria-pressed", "true");
  });
});
