import { applyScenario, ENVELOPE, HANDS_3 } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("after start every player sees only their own cards; refresh restores the hand", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_3 });

  const [ada, bob, cyd] = t.players;
  await expect(ada!.game.hand().getByText("Kitchen")).toBeVisible();
  await expect(bob!.game.hand().getByText("Dagger")).toBeVisible();
  await expect(cyd!.game.hand().getByText("Library")).toBeVisible();
  // nobody sees another player's cards in their hand
  await expect(ada!.game.hand().getByText("Dagger")).toHaveCount(0);
  await expect(bob!.game.hand().getByText("Kitchen")).toHaveCount(0);

  // all six pawns and six weapons are on the board
  await expect(ada!.game.board().getByRole("img", { name: / – / })).toHaveCount(12);
  await expect(ada!.game.pawn("Prof. Purple")).toHaveAccessibleName("Prof. Purple – corridor");

  // red moves first
  await expect(ada!.game.turnStatus()).toHaveText("Your turn");
  await expect(bob!.game.turnStatus()).toHaveText("Ada's turn");

  await bob!.page.reload();
  await expect(bob!.game.hand().getByText("Dagger")).toBeVisible();
  await expect(bob!.game.turnStatus()).toHaveText("Ada's turn");
});
