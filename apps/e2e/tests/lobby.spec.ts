import { JoinPage } from "../pages/JoinPage.js";
import { LobbyPage } from "../pages/LobbyPage.js";
import { expect, test } from "../fixtures/players.js";
import { WEB_URL } from "../fixtures/urls.js";

const ctxOptions = { locale: "en-US", baseURL: WEB_URL };

test("players create and join a room, choose characters and the host starts", async ({ table }) => {
  const { players, code, start } = await table(2);
  const [ada, bob] = players;
  await expect(ada!.page.getByText(`room: ${code}`)).toBeVisible();
  const list = ada!.lobby.players();
  await expect(list.getByText("Ada")).toBeVisible();
  await expect(list.getByText("Bob")).toBeVisible();
  await expect(list.getByRole("img", { name: "Ms. Red" })).toBeVisible();
  await expect(list.getByRole("img", { name: "Col. Yellow" })).toBeVisible();
  await expect(bob!.page.getByRole("button", { name: "Waiting for host" })).toBeDisabled();
  await start();
});

test("start is disabled until everyone has a character; taken characters are disabled", async ({ page, browser }) => {
  const code = await new JoinPage(page).createRoom("Ada");
  const lobby = new LobbyPage(page);
  await expect(lobby.startButton()).toBeDisabled();

  const ctx = await browser.newContext(ctxOptions);
  const bobPage = await ctx.newPage();
  await new JoinPage(bobPage).joinRoom("Bob", code);
  const bob = new LobbyPage(bobPage);

  await lobby.chooseCharacter("Ms. Red");
  await expect(bob.character("Ms. Red")).toBeDisabled();
  await expect(lobby.startButton()).toBeDisabled();
  await bob.chooseCharacter("Mrs. Blue");
  await expect(lobby.startButton()).toBeEnabled();
  await ctx.close();
});

test("a nickname already used in the room is rejected", async ({ page, browser }) => {
  const code = await new JoinPage(page).createRoom("Ada");
  const ctx = await browser.newContext(ctxOptions);
  const other = await ctx.newPage();
  await new JoinPage(other).joinRoom("ada", code);
  await expect(other.getByRole("alert")).toContainText("already taken");
  await ctx.close();
});

test("refreshing the page keeps the player and their character", async ({ table }) => {
  const { players, code } = await table(2);
  const bob = players[1]!;
  await bob.page.reload();
  await expect(bob.page.getByText(`room: ${code}`)).toBeVisible();
  await expect(bob.lobby.character("Col. Yellow")).toHaveAttribute("aria-pressed", "true");
});

test("home screen shows version", async ({ page }) => {
  await new JoinPage(page).open();
  await expect(page.getByText(/^Version /)).toBeVisible();
});
