import { applyScenario, ENVELOPE, HANDS_2, HANDS_3 } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("a correct accusation ends the game for everyone; host can play again", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2 });
  await ada!.game.accuse("Prof. Purple", "Wrench", "Study");

  await expect(ada!.page.getByRole("heading", { name: "You win!" })).toBeVisible();
  await expect(bob!.page.getByRole("heading", { name: "Ada wins!" })).toBeVisible();
  const envelope = bob!.page.getByRole("region", { name: "Envelope" });
  await expect(envelope.getByText("Prof. Purple")).toBeVisible();
  await expect(envelope.getByText("Wrench")).toBeVisible();
  await expect(envelope.getByText("Study")).toBeVisible();
  await expect(bob!.page.getByRole("button", { name: "Play again" })).toHaveCount(0);

  await ada!.page.getByRole("button", { name: "Play again" }).click();
  for (const p of [ada!, bob!]) await expect(p.lobby.startButton().or(p.page.getByRole("button", { name: "Waiting for host" }))).toBeVisible();
  await t.start();
});

test("a wrong accusation eliminates the player; the game continues", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_3 });
  await ada!.game.accuse("Ms. Red", "Rope", "Kitchen");

  await expect(ada!.page.getByText("You are out – you still have to show cards.")).toBeVisible();
  const envelope = ada!.page.getByRole("region", { name: "Envelope" });
  await expect(envelope.getByText("Prof. Purple")).toBeVisible();
  await expect(bob!.page.getByRole("region", { name: "Envelope" })).toHaveCount(0);
  await expect(cyd!.game.log().getByText(/Ada accuses Ms\. Red with the Rope in the Kitchen – wrong/)).toBeVisible();
  await expect(bob!.game.turnStatus()).toHaveText("Your turn");
  await expect(ada!.game.action("Roll dice")).toHaveCount(0);
});

test("in a two-player game a wrong accusation makes the other player win", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2 });
  await ada!.game.accuse("Ms. Red", "Rope", "Kitchen");
  await expect(bob!.page.getByRole("heading", { name: "You win!" })).toBeVisible();
  await expect(bob!.page.getByText("Last detective standing.")).toBeVisible();
  await expect(ada!.page.getByRole("heading", { name: "Bob wins!" })).toBeVisible();
});
