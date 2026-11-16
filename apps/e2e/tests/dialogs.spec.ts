import type { Page } from "@playwright/test";
import { applyScenario, ENVELOPE, HANDS_3, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

/** The notebook section is expanded by default on every viewport. */
async function openNotebook(page: Page): Promise<void> {
  await expect(page.getByRole("region", { name: "Notebook" })).toBeVisible();
}

test("the suggestion dialog marks cards in my hand and my notebook notes", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const ada = t.players[0]!;
  await applyScenario(request, t.code, {
    envelope: ENVELOPE,
    hands: HANDS_3,
    pawns: { red: room("kitchen") },
    summonedTo: { Ada: "kitchen" },
    activePlayer: "Ada",
  });
  await expect(ada.game.hand().getByText("Candlestick")).toBeVisible();
  await openNotebook(ada.page);
  const notebook = ada.page.getByRole("region", { name: "Notebook" });
  await notebook.getByRole("button", { name: "Dagger – Overall – empty (automatic)" }).click();
  await expect(notebook.getByRole("button", { name: "Dagger – Overall – has (manual)" })).toBeVisible();

  await ada.game.action("Suggest").click();
  const dialog = ada.page.getByRole("dialog", { name: "Make a suggestion" });
  await expect(dialog.getByRole("radio", { name: "Candlestick" })).toContainText("In your hand");
  await expect(dialog.getByRole("radio", { name: "Rope" })).not.toContainText("In your hand");
  await expect(dialog.getByRole("radio", { name: "Dagger" })).toContainText("Notebook:");
});
