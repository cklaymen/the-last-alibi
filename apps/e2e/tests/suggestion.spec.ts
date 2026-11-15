import { applyScenario, ENVELOPE, HANDS_3, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

const setup = { envelope: ENVELOPE, hands: HANDS_3 };

test("nobody can disprove; suspect pawn and weapon move to the room", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("kitchen") },
    summonedTo: { Ada: "kitchen" },
    activePlayer: "Ada",
  });
  await ada!.game.suggest("Prof. Purple", "Wrench");
  for (const p of [ada!, bob!, cyd!]) {
    await expect(p.game.log().getByText("Ada suggests Prof. Purple with the Wrench in the Kitchen.")).toBeVisible();
    await expect(p.game.log().getByText("Nobody could disprove.")).toBeVisible();
  }
  await expect(bob!.game.pawn("Prof. Purple")).toHaveAccessibleName("Prof. Purple – Kitchen");
  await expect(bob!.game.board().getByRole("img", { name: "Wrench – Kitchen" })).toBeVisible();
});

test("a disprover shows a card that only the suggester sees", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("hall") },
    summonedTo: { Ada: "hall" },
    activePlayer: "Ada",
  });
  await ada!.game.suggest("Prof. Purple", "Wrench");

  // Bob has nothing and passes automatically; Cyd holds the Hall
  await expect(ada!.game.log().getByText("Bob cannot disprove.")).toBeVisible();
  await expect(ada!.page.getByText("Waiting for Cyd to show a card…")).toBeVisible();
  const panel = cyd!.page.getByRole("region", { name: "Show a card" });
  await expect(panel.getByText("Show one card to Ada")).toBeVisible();
  await expect(panel.getByRole("button")).toHaveCount(1);
  await panel.getByRole("button", { name: "Hall" }).click();

  await expect(ada!.page.getByText("Cyd showed you: Hall")).toBeVisible();
  await expect(
    ada!.page.getByRole("region", { name: "Cards shown to you" }).getByText("Hall (from Cyd)"),
  ).toBeVisible();
  await expect(bob!.game.log().getByText("Cyd showed a card to Ada.")).toBeVisible();
  await expect(bob!.page.getByText("Cyd showed you")).toHaveCount(0);
  await expect(bob!.page.getByRole("region", { name: "Cards shown to you" }).getByText("Hall")).toHaveCount(0);
});

test("a player summoned by a suggestion can suggest on their turn without moving", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob] = t.players;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("kitchen") },
    summonedTo: { Ada: "kitchen" },
    activePlayer: "Ada",
  });
  await ada!.game.suggest("Col. Yellow", "Rope"); // summons Bob (yellow) to the Kitchen
  await expect(ada!.game.log().getByText(/Ada suggests Col\. Yellow/)).toBeVisible();
  // Ada holds Col. Yellow herself; Bob/Cyd: Cyd has Rope → must show
  const cydPanel = t.players[2]!.page.getByRole("region", { name: "Show a card" });
  await cydPanel.getByRole("button", { name: "Rope" }).click();
  await ada!.game.action("End turn").click();

  await expect(bob!.game.turnStatus()).toHaveText("Your turn");
  await expect(bob!.game.pawn("Col. Yellow")).toHaveAccessibleName("Col. Yellow – Kitchen");
  await expect(bob!.game.action("Suggest")).toBeVisible();
});
