import { applyScenario, ENVELOPE, HANDS_2, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("host changes turn limit, guest sees it", async ({ table }) => {
  const t = await table(2);
  const [ada, bob] = t.players;
  await expect(ada!.lobby.setting("Turn time limit")).toBeEnabled();
  await expect(ada!.lobby.selected("Turn time limit")).toHaveText("90 s");
  await expect(bob!.lobby.setting("Turn time limit")).toBeDisabled();
  await expect(bob!.lobby.setting("Automatic notes")).toBeDisabled();

  await ada!.lobby.setting("Turn time limit").selectOption({ label: "180 s" });
  // Controlled by server state: the box flips once the room update arrives.
  await ada!.lobby.setting("Automatic notes").click();
  await expect(ada!.lobby.setting("Automatic notes")).not.toBeChecked();

  await expect(bob!.lobby.selected("Turn time limit")).toHaveText("180 s");
  await expect(bob!.lobby.setting("Automatic notes")).not.toBeChecked();
});

test("settings survive a finished game", async ({ table, request }) => {
  const t = await table(2);
  const [ada, bob] = t.players;
  await ada!.lobby.setting("Time to show a card").selectOption({ label: "None" });
  await ada!.lobby.setting("Accusation location").selectOption({ label: "The named room" });
  await expect(bob!.lobby.selected("Accusation location")).toHaveText("The named room");

  await t.start();
  // Ada stands in the study, so the accusation is valid under every accusation rule.
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2, pawns: { red: room("study") } });
  await ada!.game.accuse("Prof. Purple", "Wrench", "Study");

  await expect(
    bob!.page.getByRole("region", { name: "Last game" }).getByRole("heading", { name: "Ada wins!" }),
  ).toBeVisible();
  for (const p of [ada!, bob!]) {
    await expect(p.lobby.selected("Time to show a card")).toHaveText("None");
    await expect(p.lobby.selected("Accusation location")).toHaveText("The named room");
  }
  await expect(ada!.lobby.setting("Time to show a card")).toBeEnabled();
  await expect(bob!.lobby.setting("Time to show a card")).toBeDisabled();
});
