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
  const result = (p: typeof ada) => p!.game.actions().getByRole("region", { name: "Suggestion result" });
  await expect(result(ada)).toHaveText("Nobody could disprove");
  await expect(result(bob)).toHaveText("Nobody could disprove Ada's suggestion");
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

  await expect(ada!.game.actions().getByText("Cyd showed you a card:")).toBeVisible();
  await expect(
    ada!.game.notebook().getByRole("button", { name: "Hall – Cyd – has (automatic) – shown to you" }),
  ).toBeVisible();
  await expect(bob!.game.log().getByText("Cyd showed a card to Ada.")).toBeVisible();
  await expect(bob!.game.actions().getByText("Cyd showed a card to Ada")).toBeVisible();
  await expect(bob!.page.getByText("Cyd showed you")).toHaveCount(0);
  await expect(bob!.game.notebook().getByRole("button", { name: /^Hall – Cyd – has/ })).toHaveCount(0);
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

test("summoned player suggests, then Roll button is gone", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada] = t.players;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("kitchen") },
    summonedTo: { Ada: "kitchen" },
    activePlayer: "Ada",
  });
  await expect(ada!.game.action("Roll dice")).toBeVisible();
  await expect(ada!.game.action("Secret passage")).toBeVisible();
  await ada!.game.suggest("Prof. Purple", "Wrench");
  await expect(ada!.game.log().getByText("Nobody could disprove.")).toBeVisible();
  await expect(ada!.game.action("Roll dice")).toHaveCount(0);
  await expect(ada!.game.action("Secret passage")).toHaveCount(0);
  await expect(ada!.game.action("End turn")).toBeVisible();
});

test("the suggestion result stays in the action section until the turn ends", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("hall") },
    summonedTo: { Ada: "hall" },
    activePlayer: "Ada",
  });
  await ada!.game.suggest("Prof. Purple", "Dagger"); // Bob holds the Dagger
  await bob!.page.getByRole("region", { name: "Show a card" }).getByRole("button", { name: "Dagger" }).click();

  const adaResult = ada!.game.actions().getByRole("region", { name: "Suggestion result" });
  await expect(adaResult.getByText("Bob showed you a card:")).toBeVisible();
  await expect(adaResult.getByText("Dagger")).toBeVisible();
  const cydResult = cyd!.game.actions().getByRole("region", { name: "Suggestion result" });
  await expect(cydResult).toHaveText("Bob showed a card to Ada");
  await expect(cyd!.game.actions().getByText("Dagger")).toHaveCount(0);

  await ada!.game.action("End turn").click();
  await expect(bob!.game.turnStatus()).toHaveText("Your turn");
  for (const p of [ada!, bob!, cyd!]) {
    await expect(p.game.actions().getByRole("region", { name: "Suggestion result" })).toHaveCount(0);
  }
});

test("with the option on, a player starting in a room sees Suggest before rolling", async ({ table, request }) => {
  const t = await table(2);
  const [ada] = t.players;
  await ada!.lobby.setting("Suggest after staying in a room").click();
  await expect(ada!.lobby.setting("Suggest after staying in a room")).toBeChecked();
  await t.start();
  await applyScenario(request, t.code, {
    envelope: ENVELOPE,
    pawns: { red: room("kitchen") },
    activePlayer: "Ada",
  });
  await expect(ada!.game.action("Suggest")).toBeVisible();
  await expect(ada!.game.action("Roll dice")).toBeVisible();
  await ada!.game.suggest("Prof. Purple", "Wrench");
  await expect(ada!.game.action("Roll dice")).toHaveCount(0);
});

test("suggestion dialog shows 'In your hand' under the room I hold", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const ada = t.players[0]!;
  await applyScenario(request, t.code, {
    ...setup,
    pawns: { red: room("kitchen") },
    summonedTo: { Ada: "kitchen" },
    activePlayer: "Ada",
  });
  await ada.game.action("Suggest").click();
  const dialog = ada.page.getByRole("dialog", { name: "Make a suggestion" });
  await expect(dialog.getByRole("group", { name: "Room" }).getByText("In your hand")).toBeVisible();
});
