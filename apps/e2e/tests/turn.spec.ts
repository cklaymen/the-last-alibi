import { applyScenario, cell, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("roll, log and end turn", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { dice: [[3, 4]] });

  await expect(bob!.game.action("Roll dice")).toHaveCount(0);
  await ada!.game.action("Roll dice").click();
  await expect(ada!.page.getByText("You rolled 3 + 4 = 7")).toBeVisible();
  for (const p of [ada!, bob!])
    await expect(p.game.log().getByText("Ada rolled 7 (3 + 4).")).toBeVisible();

  await ada!.game.action("End turn").click();
  await expect(bob!.game.turnStatus()).toHaveText("Your turn");
  await expect(ada!.game.turnStatus()).toHaveText("Bob's turn");
  await expect(ada!.game.action("Roll dice")).toHaveCount(0);
  await expect(bob!.game.action("Roll dice")).toBeVisible();
});

test("move along the corridor and into a room", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  // Ada stands right in front of the Hall door; Bob blocks a corridor cell next to her.
  await applyScenario(request, t.code, {
    pawns: { red: cell(17, 10), yellow: cell(16, 10) },
    dice: [[1, 1], [2, 2]],
    activePlayer: "Ada",
  });
  await ada!.game.action("Roll dice").click();
  const board = ada!.game.board();
  await expect(board.getByRole("button", { name: "Enter Hall" })).toBeVisible();
  // occupied cell (row 17, col 11 in 1-based labels) is not highlighted
  await expect(board.getByRole("button", { name: "Move to row 17, column 11" })).toHaveCount(0);
  await board.getByRole("button", { name: "Move to row 18, column 9" }).click();
  await expect(bob!.game.pawn("Ms. Red")).toHaveAccessibleName("Ms. Red – corridor");
  await ada!.game.action("End turn").click();

  await applyScenario(request, t.code, { pawns: { red: cell(17, 11) }, activePlayer: "Ada" });
  await ada!.game.action("Roll dice").click();
  await ada!.game.board().getByRole("button", { name: "Enter Hall" }).click();
  await expect(bob!.game.pawn("Ms. Red")).toHaveAccessibleName("Ms. Red – Hall");
  await expect(bob!.game.log().getByText("Ada entered the Hall.")).toBeVisible();
  void room;
});

test("secret passage instead of rolling", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { pawns: { red: room("kitchen") }, activePlayer: "Ada" });
  await ada!.game.action("Secret passage").click();
  await expect(bob!.game.pawn("Ms. Red")).toHaveAccessibleName("Ms. Red – Study");
  await expect(ada!.game.action("Roll dice")).toHaveCount(0);
  await expect(bob!.game.log().getByText("Ada took the secret passage from the Kitchen to the Study.")).toBeVisible();
});
