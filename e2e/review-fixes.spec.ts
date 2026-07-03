import { expect, test } from "@playwright/test";

test.describe("review fixes", () => {
  test("navigating to the bare route resets the converter so URL and state agree", async ({
    page,
  }) => {
    await page.goto("/?c=ff5733");
    const input = page.getByRole("textbox", {
      name: "Color — oklch, hsla, rgba or hex",
      exact: true,
    });
    await expect(input).toHaveValue("#ff5733");

    await page
      .getByRole("navigation", { name: "Tools" })
      .getByRole("link", { name: "Convert" })
      .click();

    await expect(page).toHaveURL("/");
    await expect(input).toHaveValue("oklch(0.7 0.15 230 / 0.5)");
  });

  test("clearing a comparison input removes the color from the card and the URL", async ({
    page,
  }) => {
    await page.goto("/compare?b=1e90ff&c=ff5733,00bd00");
    const card1 = page.getByRole("article", { name: "Comparison 1" });

    await card1.getByRole("textbox", { name: "Color", exact: true }).fill("");

    await expect(page).toHaveURL(/c=00bd00/);
    await expect(page).not.toHaveURL(/ff5733/);
    await expect(card1.locator("dd")).toHaveCount(0);
  });

  test("clearing the converter input flags the empty state instead of staying silent", async ({
    page,
  }) => {
    await page.goto("/?c=ff5733");
    const input = page.getByRole("textbox", {
      name: "Color — oklch, hsla, rgba or hex",
      exact: true,
    });

    await input.fill("");

    await expect(
      page.getByRole("alert").filter({ hasText: "Enter a color" }),
    ).toBeVisible();
  });
});
