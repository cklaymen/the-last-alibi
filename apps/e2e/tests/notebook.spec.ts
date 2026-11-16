import { applyScenario, ENVELOPE, HANDS_2, HANDS_3, room } from "../fixtures/api.js";
import { expect, test } from "../fixtures/players.js";

test("notebook marks own cards and keeps manual notes after a reload", async ({ table, request }) => {
  const t = await table(2);
  await t.start();
  const ada = t.players[0]!;
  await applyScenario(request, t.code, { envelope: ENVELOPE, hands: HANDS_2 });
  for (const card of ["Mrs. Blue", "Revolver", "Rope", "Kitchen"]) await expect(ada.game.hand().getByText(card)).toBeVisible();
  await expect(ada.game.notebook().getByRole("img", { name: "Kitchen – Bob – not (in hand)" })).toBeVisible();

  await ada.game.notebookCell("Study", "Bob", "empty").click();
  await ada.game.notebookCell("Study", "Bob", "has").click();
  await expect(ada.game.notebookCell("Study", "Bob", "not")).toHaveAccessibleName("Study – Bob – not (manual)");

  await ada.page.reload();
  await ada.game.expectInGame();
  await expect(ada.game.notebookCell("Study", "Bob", "not")).toHaveAccessibleName("Study – Bob – not (manual)");
});

test("a player who cannot disprove gets ✗ automatically in their column", async ({ table, request }) => {
  const t = await table(3);
  await t.start();
  const [ada] = t.players;
  await applyScenario(request, t.code, {
    envelope: ENVELOPE,
    hands: HANDS_3,
    pawns: { red: room("hall") },
    summonedTo: { Ada: "hall" },
    activePlayer: "Ada",
  });
  await ada!.game.suggest("Prof. Purple", "Wrench"); // Bob holds none of Purple / Wrench / Hall
  await expect(ada!.game.log().getByText("Bob cannot disprove.")).toBeVisible();
  for (const card of ["Prof. Purple", "Wrench", "Hall"])
    await expect(ada!.game.notebookCell(card, "Bob", "not")).toHaveAccessibleName(`${card} – Bob – not (automatic)`);
});

test("6-player notebook table fits 360 px", async ({ table }) => {
  test.slow(); // six browser contexts
  const t = await table(6);
  await t.start();
  const page = t.players[0]!.page;
  await page.setViewportSize({ width: 360, height: 780 });
  const notebook = t.players[0]!.game.notebook();
  await notebook.scrollIntoViewIfNeeded();
  await expect(notebook.getByRole("columnheader", { name: "Bob" }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const box = (await notebook.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});
