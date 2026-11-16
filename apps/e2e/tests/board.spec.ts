import { applyScenario, cell, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("tapping a pawn shows its name; tapping a pawn in a reachable room still moves", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, {
    pawns: { red: cell(17, 10), yellow: room("hall") },
    dice: [[1, 1]],
    activePlayer: "Ada",
  });
  const board = ada!.game.board();
  await ada!.game.pawn("Col. Yellow").click();
  await expect(board.getByRole("tooltip")).toHaveText("Col. Yellow (Bob)");
  await board.getByRole("img", { name: /^Rope – / }).click();
  await expect(board.getByRole("tooltip")).toHaveText("Rope");

  await ada!.game.action("Roll dice").click();
  await expect(board.getByRole("button", { name: "Enter Hall" })).toBeVisible();
  await ada!.game.pawn("Col. Yellow").click();
  await expect(bob!.game.pawn("Ms. Red")).toHaveAccessibleName("Ms. Red – Hall");
  await expect(ada!.game.pawn("Ms. Red").locator('[data-highlight="active"]')).toHaveCount(1);
});
