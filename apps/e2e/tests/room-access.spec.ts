import { JoinPage } from "../pages/JoinPage.js";
import { expect, test } from "../fixtures/players.js";
import { WEB_URL } from "../fixtures/urls.js";

const ctxOptions = { locale: "en-US", baseURL: WEB_URL };

test("the URL reflects the room and a shared link lets a friend join with their nickname", async ({ page, browser }) => {
  const code = await new JoinPage(page).createRoom("Ada");
  await expect(page).toHaveURL(new RegExp(`/room/${code}$`));

  const ctx = await browser.newContext(ctxOptions);
  const friend = await ctx.newPage();
  await friend.goto(`/room/${code}`);
  await expect(friend.getByRole("heading", { name: `Join room ${code}` })).toBeVisible();
  await friend.getByLabel("Your nickname").fill("Bob");
  await friend.getByRole("button", { name: "Join room" }).click();
  await expect(friend.getByText(`room: ${code}`)).toBeVisible();
  await expect(page.getByRole("region", { name: "Players" }).getByText("Bob")).toBeVisible();
  await ctx.close();
});

test("a link to a room that does not exist shows an error", async ({ page }) => {
  await page.goto("/room/999999");
  await expect(page.getByRole("alert")).toContainText("This room does not exist.");
  await expect(page.getByRole("button", { name: "Join room" })).toBeDisabled();
  await page.getByRole("button", { name: "Create a new room instead" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the browser remembers the last nickname", async ({ page }) => {
  await new JoinPage(page).createRoom("Ada");
  await page.getByRole("button", { name: "Leave room" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Your nickname")).toHaveValue("Ada");
});

test("a player can change their nickname in the room, but not to a taken one", async ({ table }) => {
  const t = await table(2);
  const [ada, bob] = t.players;
  await bob!.page.getByRole("button", { name: "Change nickname" }).click();
  const dialog = bob!.page.getByRole("dialog", { name: "Change nickname" });
  await dialog.getByLabel("Nickname").fill("ADA");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByRole("alert")).toContainText("already taken");
  await dialog.getByLabel("Nickname").fill("Bobby");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(ada!.lobby.players().getByText("Bobby")).toBeVisible();
  await expect(bob!.page.getByRole("button", { name: "Change nickname" })).toContainText("Bobby");
});

test("the host can remove a player from the lobby", async ({ table }) => {
  const t = await table(3);
  const [ada, bob, cyd] = t.players;
  await expect(bob!.page.getByRole("button", { name: "Remove Cyd" })).toHaveCount(0);
  await ada!.page.getByRole("button", { name: "Remove Bob" }).click();
  await expect(bob!.page.getByRole("alert")).toContainText("The host removed you from the room.");
  await expect(bob!.page).toHaveURL(/\/$/);
  await expect(ada!.lobby.players().getByText("Bob")).toHaveCount(0);
  await expect(cyd!.lobby.players().getByText("Bob")).toHaveCount(0);
});
