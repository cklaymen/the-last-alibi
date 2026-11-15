import { applyScenario, ENVELOPE, HANDS_2, HANDS_3 } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("a correct accusation ends the game: everyone is back in the room's lobby with a summary", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2 });
  await ada!.game.accuse("Prof. Purple", "Wrench", "Study");

  const adaLast = ada!.page.getByRole("region", { name: "Last game" });
  const bobLast = bob!.page.getByRole("region", { name: "Last game" });
  await expect(adaLast.getByRole("heading", { name: "You win!" })).toBeVisible();
  await expect(bobLast.getByRole("heading", { name: "Ada wins!" })).toBeVisible();
  const envelope = bobLast.getByRole("region", { name: "Envelope" });
  await expect(envelope.getByText("Prof. Purple")).toBeVisible();
  await expect(envelope.getByText("Wrench")).toBeVisible();
  await expect(envelope.getByText("Study")).toBeVisible();
  for (const p of [ada!, bob!]) {
    await expect(p.page.getByText(`room: ${t.code}`)).toBeVisible();
    await expect(p.page).toHaveURL(new RegExp(`/room/${t.code}$`));
  }
  await expect(bob!.page.getByRole("button", { name: "Waiting for host" })).toBeVisible();

  // a non-host keeps the room after a reload, too
  await bob!.page.reload();
  await expect(bob!.page.getByText(`room: ${t.code}`)).toBeVisible();

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
  const bobLast = bob!.page.getByRole("region", { name: "Last game" });
  await expect(bobLast.getByRole("heading", { name: "You win!" })).toBeVisible();
  await expect(bobLast.getByText("Last detective standing.")).toBeVisible();
  await expect(
    ada!.page.getByRole("region", { name: "Last game" }).getByRole("heading", { name: "Bob wins!" }),
  ).toBeVisible();
});
