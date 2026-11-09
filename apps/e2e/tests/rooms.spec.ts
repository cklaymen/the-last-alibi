import { expect, test, type Browser, type Page } from "@playwright/test";

async function createRoom(page: Page, nickname: string): Promise<string> {
  await page.goto("/");
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Create room" }).click();
  const label = page.getByText(/room: \d{6}/);
  await expect(label).toBeVisible();
  const code = (await label.textContent())?.replace("room:", "").trim();
  expect(code).toMatch(/^\d{6}$/);
  return code ?? "";
}

async function joinRoom(browser: Browser, nickname: string, code: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Your nickname").fill(nickname);
  await page.getByRole("button", { name: "Join room" }).click();
  await page.getByLabel("Room code").fill(code);
  await page.getByRole("button", { name: "Join room" }).click();
  await expect(page.getByText(`room: ${code}`)).toBeVisible();
  return { page, context };
}

test("two players can create and join the same private room", async ({
  browser,
  page,
}) => {
  const code = await createRoom(page, "Ada");
  const start = page.getByRole("button", { name: /Select character|Enter/ });
  await expect(start).toBeDisabled();

  const { page: secondPage, context } = await joinRoom(browser, "Jan", code);

  // Both players are listed; nobody has an avatar yet
  const list = page.getByRole("region", { name: "Players" });
  await expect(list.getByText("Ada")).toBeVisible();
  await expect(list.getByText("Jan")).toBeVisible();
  await expect(list.getByRole("img")).toHaveCount(0);

  // Enter stays disabled until both players choose a character
  await page.getByRole("button", { name: "Miss Scarlett" }).click();
  await expect(page.getByRole("button", { name: "Enter" })).toBeDisabled();

  await secondPage.getByRole("button", { name: "Col. Mustard" }).click();
  await expect(list.getByRole("img", { name: "Miss Scarlett" })).toBeVisible();
  await expect(list.getByRole("img", { name: "Col. Mustard" })).toBeVisible();

  // Now the host (Ada) can start
  await expect(page.getByRole("button", { name: "Enter" })).toBeEnabled();
  await page.getByRole("button", { name: "Enter" }).click();
  await expect(page.getByText("Game in progress")).toBeVisible();
  await expect(secondPage.getByText("Game in progress")).toBeVisible();
  await context.close();
});

test("a taken character cannot be chosen by another player", async ({
  browser,
  page,
}) => {
  const code = await createRoom(page, "Ada");
  const { page: secondPage, context } = await joinRoom(browser, "Jan", code);

  // Ada picks Scarlett — Jan's Scarlett tile should become disabled
  await page.getByRole("button", { name: "Miss Scarlett" }).click();
  await expect(
    secondPage.getByRole("button", { name: "Miss Scarlett" }),
  ).toBeDisabled();

  await context.close();
});
