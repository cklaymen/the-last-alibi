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

test("players bar sits next to the zoom buttons, which stay visible with 6 players at 360 px", async ({ table }) => {
  test.slow(); // six browser contexts
  const t = await table(6);
  await t.start();
  const page = t.players[0]!.page;
  await page.setViewportSize({ width: 360, height: 780 });
  const bar = page.getByRole("region", { name: "Players" });
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  const reset = page.getByRole("button", { name: "Reset zoom" });
  await expect(bar.getByRole("listitem")).toHaveCount(6);
  await expect(zoomIn).toBeInViewport();
  await expect(reset).toBeInViewport();
  const barBox = (await bar.boundingBox())!;
  const zoomBox = (await zoomIn.boundingBox())!;
  expect(Math.abs(barBox.y + barBox.height / 2 - (zoomBox.y + zoomBox.height / 2))).toBeLessThan(zoomBox.height);
  expect(barBox.x + barBox.width).toBeLessThanOrEqual(zoomBox.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(bar.locator('[aria-current="true"]')).toHaveAccessibleName(/^Ada \(you\) – /);
});
