import { expect, test } from "@playwright/test";

test.describe("alpha slider", () => {
  test("converter: lowering alpha reveals the alpha preview and updates the URL", async ({
    page,
  }) => {
    await page.goto("/?c=1e90ff");
    await expect(page.getByLabel("Alpha blending preview")).toBeHidden();

    await page
      .getByLabel("Color — oklch, hsla, rgba or hex — alpha", { exact: true })
      .fill("0.35");

    // 0.35 * 255 rounds to 89 = 0x59.
    await expect(page).toHaveURL(/c=1e90ff59/);
    await expect(page.getByLabel("Alpha blending preview")).toBeVisible();
    await expect(
      page.getByRole("textbox", {
        name: "Color — oklch, hsla, rgba or hex",
        exact: true,
      }),
    ).toHaveValue("#1e90ff59");
  });

  test("compare: per-color alpha changes the metrics and lands in the share URL", async ({
    page,
  }) => {
    await page.goto("/compare?b=1e90ff&c=000000");
    const card = page.getByRole("article", { name: "Comparison 1" });
    const contrast = card.locator("dd").nth(2);
    const contrastBefore = await contrast.innerText();

    await card.getByLabel("Color — alpha", { exact: true }).fill("0.35");

    await expect(page).toHaveURL(/c=00000059/);
    await expect(contrast).not.toHaveText(contrastBefore);
    await expect(card.getByRole("textbox", { name: "Color", exact: true })).toHaveValue(
      "#00000059",
    );
  });

  test("compare: base color has its own alpha slider", async ({ page }) => {
    await page.goto("/compare?b=1e90ff&c=ffffff");

    await page.getByLabel("Base color — alpha", { exact: true }).fill("0.5");

    await expect(page).toHaveURL(/b=1e90ff80/);
  });
});
