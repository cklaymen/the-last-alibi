import { expect, test } from "../fixtures/players.js";

test("actions stay visible after scrolling to the notebook", async ({ table }) => {
  const t = await table(2);
  await t.start();
  const ada = t.players[0]!;

  await expect(ada.game.actions()).toBeVisible();
  await expect(ada.game.actions()).toHaveAttribute("data-attention", "action");
  await expect(t.players[1]!.game.actions()).toHaveAttribute("data-attention", "none");

  // The last notebook cell (Study) is the bottom of the right column.
  const lastCell = ada.game.section("Notebook").getByRole("button", { name: /^Study: / });
  await lastCell.scrollIntoViewIfNeeded();
  await expect(lastCell).toBeInViewport();
  await expect(ada.game.actions()).toBeInViewport();
  await expect(ada.game.action("Roll dice")).toBeInViewport();
});

test("event log collapses and stays collapsed after reload", async ({ table }) => {
  const t = await table(2);
  await t.start();
  const ada = t.players[0]!;

  await expect(ada.game.log()).toBeVisible();
  await ada.game.sectionToggle("Event log").click();
  await expect(ada.game.log()).toBeHidden();

  await ada.page.reload();
  await expect(ada.game.board()).toBeVisible();
  await expect(ada.game.log()).toBeHidden();
  await expect(ada.game.section("Notebook")).toBeVisible();

  await ada.game.sectionToggle("Event log").click();
  await expect(ada.game.log()).toBeVisible();
});
