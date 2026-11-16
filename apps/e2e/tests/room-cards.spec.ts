import { applyScenario, ENVELOPE, HANDS_2, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("player entering a room with a card sees it, the other player does not", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, {
    envelope: ENVELOPE,
    hands: { Ada: HANDS_2.Ada.filter((c) => c !== "conservatory"), Bob: HANDS_2.Bob },
    roomCards: { lounge: "conservatory" },
    pawns: { red: room("kitchen") },
    activePlayer: "Ada",
  });
  const peek = (p: typeof ada) => p!.game.actions().getByRole("region", { name: "Face-down card" });
  await expect(ada!.game.action("Secret passage")).toBeVisible();
  await expect(peek(ada)).toHaveCount(0);

  await applyScenario(request, t.code, { pawns: { red: room("conservatory") }, activePlayer: "Ada" });
  await ada!.game.action("Secret passage").click();
  await expect(ada!.game.pawn("Ms. Red")).toHaveAccessibleName("Ms. Red – Lounge");
  await expect(peek(ada)).toContainText("Conservatory");
  await expect(peek(bob)).toHaveCount(0);
  await expect(bob!.game.actions().getByText("Conservatory")).toHaveCount(0);
});
