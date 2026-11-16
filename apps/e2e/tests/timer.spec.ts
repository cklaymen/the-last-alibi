import { applyScenario, ENVELOPE, HANDS_3, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("both players see the turn timer; when it ends the turn passes", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { activePlayer: "Ada", timeLimitsMs: { turn: 3000 } });
  for (const p of [ada!, bob!]) {
    await expect(p.game.actions().getByRole("timer", { name: /^Time left for Ada: \d+ s$/ })).toBeVisible();
  }
  await expect(bob!.game.turnStatus()).toHaveText("Your turn", { timeout: 10_000 });
  await expect(ada!.game.log().getByText("Ada's time ran out")).toBeVisible();
});

test("when the disprove time ends a random card is shown", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, {
    envelope: ENVELOPE,
    hands: HANDS_3,
    pawns: { red: room("hall") },
    summonedTo: { Ada: "hall" },
    activePlayer: "Ada",
    timeLimitsMs: { disprove: 3000 },
  });
  await ada!.game.suggest("Prof. Purple", "Dagger"); // only Bob holds the Dagger
  await expect(cyd!.game.actions().getByRole("timer", { name: /^Time left for Bob: \d+ s$/ })).toBeVisible();
  const message = "Bob did not choose in time – a random card was shown";
  await expect(ada!.game.log().getByText(message)).toBeVisible({ timeout: 10_000 });
  await expect(
    ada!.game.actions().getByRole("region", { name: "Suggestion result" }).getByText("Dagger"),
  ).toBeVisible();
  await expect(bob!.page.getByRole("region", { name: "Show a card" })).toHaveCount(0);
});
