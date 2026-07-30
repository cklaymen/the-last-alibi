import { expect, test } from "@playwright/test";

test("two players can create and join the same private room", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your nickname").fill("Ada");
  await page.getByRole("button", { name: "Create room" }).click();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(/Room \d{6}/);
  const headingText = await heading.textContent();
  const roomCode = headingText?.replace("Room ", "").trim();
  expect(roomCode).toMatch(/^\d{6}$/);
  await expect(page.getByRole("button", { name: "Start game" })).toBeDisabled();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Your nickname").fill("Jan");
  await secondPage.getByLabel("Room code").fill(roomCode ?? "");
  await secondPage.getByRole("button", { name: "Join room" }).click();

  await expect(page.getByText("2 / 6", { exact: false })).toBeVisible();
  await expect(secondPage.getByText("2 / 6", { exact: false })).toBeVisible();

  // Start button stays disabled until both players choose a character
  await expect(page.getByRole("button", { name: "Start game" })).toBeDisabled();

  // Ada chooses Miss Scarlett
  await page.getByRole("button", { name: "Miss Scarlett" }).click();
  await expect(page.getByRole("button", { name: "Start game" })).toBeDisabled();

  // Jan chooses Col. Mustard
  await secondPage.getByRole("button", { name: "Col. Mustard" }).click();

  // Now the host (Ada) can start
  await expect(page.getByRole("button", { name: "Start game" })).toBeEnabled();
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByText("Game in progress")).toBeVisible();
  await expect(secondPage.getByText("Game in progress")).toBeVisible();
  await secondContext.close();
});

test("a taken character cannot be chosen by another player", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your nickname").fill("Ada");
  await page.getByRole("button", { name: "Create room" }).click();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(/Room \d{6}/);
  const headingText = await heading.textContent();
  const roomCode = headingText?.replace("Room ", "").trim();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Your nickname").fill("Jan");
  await secondPage.getByLabel("Room code").fill(roomCode ?? "");
  await secondPage.getByRole("button", { name: "Join room" }).click();

  // Ada picks Scarlett — Jan's Scarlett button should become disabled
  await page.getByRole("button", { name: "Miss Scarlett" }).click();
  await expect(
    secondPage.getByRole("button", { name: "Miss Scarlett" }),
  ).toBeDisabled();

  await secondContext.close();
});
