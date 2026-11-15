import { expect, test } from "@playwright/test";

test.use({ locale: "en-US" });

test("theme choice sets data-theme and survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test.describe("system dark scheme", () => {
  test.use({ colorScheme: "dark" });
  test("system theme follows prefers-color-scheme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test("switching to Polish changes labels and survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Polski" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("button", { name: "Utwórz pokój" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Utwórz pokój" })).toBeVisible();
});
