import { expect, test } from "@playwright/test";

test("two players can create and join the same private room", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your nickname").fill("Ada");
  await page.getByRole("button", { name: "Create room" }).click();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(/Room MYST-\d{2}/);
  const roomCode = (await heading.textContent())?.replace("Room ", "");
  expect(roomCode).toMatch(/^MYST-\d{2}$/);
  await expect(page.getByRole("button", { name: "Start game" })).toBeDisabled();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Your nickname").fill("Jan");
  await secondPage.getByLabel("Room code").fill(roomCode ?? "");
  await secondPage.getByRole("button", { name: "Join room" }).click();

  await expect(page.getByText("2 / 6", { exact: false })).toBeVisible();
  await expect(secondPage.getByText("2 / 6", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled();
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByText("Game started")).toBeVisible();
  await expect(secondPage.getByText("Game started")).toBeVisible();
  await secondContext.close();
});
