import { expect, test } from "@playwright/test";

test("two players can create and join the same private room", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Twój pseudonim").fill("Ada");
  await page.getByRole("button", { name: "Utwórz pokój" }).click();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(/Pokój MYST-\d{2}/);
  const roomCode = (await heading.textContent())?.replace("Pokój ", "");
  expect(roomCode).toMatch(/^MYST-\d{2}$/);

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  await secondPage.getByLabel("Twój pseudonim").fill("Jan");
  await secondPage.getByLabel("Kod pokoju").fill(roomCode ?? "");
  await secondPage.getByRole("button", { name: "Dołącz do pokoju" }).click();

  await expect(secondPage.getByText("2 / 6", { exact: false })).toBeVisible();
  await secondContext.close();
});
