import { applyScenario, ENVELOPE, HANDS_3 } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

// The e2e API runs with a short grace period (PRESENCE_GRACE_MS in playwright.config.ts).

test("a player who closes the tab in the lobby is shown offline and then leaves the room", async ({ table }) => {
  const t = await table(2);
  const [ada, bob] = t.players;
  await bob!.context.close();
  const row = ada!.lobby.players().getByRole("listitem").filter({ hasText: "Bob" });
  await expect(row).toContainText("offline");
  await expect(ada!.lobby.players().getByText("Bob")).toHaveCount(0, { timeout: 15_000 });
});

test("during a game an away player's turn is skipped and they can come back", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada, bob, cyd] = t.players;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_3 });

  const bobPage = bob!.page;
  const url = bobPage.url();
  const context = bob!.context;
  await bobPage.close();
  const bar = ada!.page.getByRole("region", { name: "Players" });
  await expect(bar.getByRole("listitem").filter({ hasText: "Bob" })).toHaveAccessibleName(/ – (offline|away)/);

  await ada!.game.action("End turn").click();
  await expect(ada!.game.log().getByText("Bob is away – turn skipped.")).toBeVisible({ timeout: 15_000 });
  await expect(cyd!.game.turnStatus()).toHaveText("Your turn");

  // Bob comes back (same browser) and is online again
  const back = await context.newPage();
  await back.goto(url);
  await expect(back.getByRole("region", { name: "Cards" }).locator("tr[data-in-hand]").getByText("Dagger")).toBeVisible();
  await expect(bar.getByRole("listitem").filter({ hasText: "Bob" })).not.toHaveAccessibleName(/ – (offline|away)/);
});
