import { expect, test } from "../fixtures/players.js";
import { WEB_URL } from "../fixtures/urls.js";

test("rules button opens \"How to play\" on the home screen", async ({ page }) => {
  await page.goto(WEB_URL);
  await page.getByRole("button", { name: "Rules" }).click();
  const dialog = page.getByRole("dialog", { name: "How to play" });
  await expect(dialog).toContainText("The host can change some rules in the room settings.");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("in the lobby a guest sees the host's turn limit as a room setting", async ({ table }) => {
  const t = await table(2);
  const [ada, bob] = t.players;
  await ada!.lobby.setting("Turn time limit").selectOption({ label: "30 s" });
  await expect(bob!.lobby.selected("Turn time limit")).toHaveText("30 s");
  await bob!.page.getByRole("button", { name: "Rules" }).click();
  await expect(
    bob!.page.getByRole("dialog", { name: "How to play" }).getByRole("listitem").filter({ hasText: "30 s per turn" }),
  ).toContainText("Room setting");
});
