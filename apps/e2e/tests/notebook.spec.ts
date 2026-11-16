import { applyScenario, ENVELOPE, HANDS_2 } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";
import type { Page } from "@playwright/test";

/** The notebook section is expanded by default on every viewport. */
async function openNotebook(page: Page): Promise<void> {
  await expect(page.getByRole("region", { name: "Notebook" })).toBeVisible();
}

test("notebook marks own cards and keeps notes after a reload", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const ada = t.players[0]!;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2 });
  for (const card of ["Mrs. Blue", "Revolver", "Rope", "Kitchen"])
    await expect(ada.game.hand().getByText(card)).toBeVisible();
  // The notebook pre-marked the random deal before the scenario replaced the hands.
  await ada.page.evaluate(() => {
    for (const key of Object.keys(localStorage))
      if (key.startsWith("notebook:")) localStorage.removeItem(key);
  });
  await ada.page.reload();
  await ada.game.expectInGame();

  const notebook = ada.page.getByRole("region", { name: "Notebook" });
  await openNotebook(ada.page);
  await expect(notebook.getByRole("button", { name: "Kitchen: has" })).toBeVisible();
  await notebook.getByRole("button", { name: "Study: empty" }).click();
  await notebook.getByRole("button", { name: "Study: has" }).click();
  await expect(notebook.getByRole("button", { name: "Study: not" })).toBeVisible();

  await ada.page.reload();
  await ada.game.expectInGame();
  const again = ada.page.getByRole("region", { name: "Notebook" });
  await openNotebook(ada.page);
  await expect(again.getByRole("button", { name: "Study: not" })).toBeVisible();
});
