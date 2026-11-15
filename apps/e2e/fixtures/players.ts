import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";
import { GamePage } from "../pages/GamePage.js";
import { JoinPage } from "../pages/JoinPage.js";
import { LobbyPage } from "../pages/LobbyPage.js";

export interface PlayerHandle {
  name: string;
  page: Page;
  context: BrowserContext;
  lobby: LobbyPage;
  game: GamePage;
}

export interface Table {
  code: string;
  players: PlayerHandle[];
  /** Host starts the game and waits until everyone sees the board. */
  start: () => Promise<void>;
}

/** Default seats: the host plays red, so the host moves first. */
const CHARACTERS = ["Ms. Red", "Col. Yellow", "Mrs. White", "Mr. Green", "Mrs. Blue", "Prof. Purple"];
const NAMES = ["Ada", "Bob", "Cyd", "Dan", "Eve", "Fay"];

type Fixtures = {
  /** Creates a room with N players (separate browser contexts), each with a character. */
  table: (n: number, opts?: { characters?: string[] }) => Promise<Table>;
};

export const test = base.extend<Fixtures>({
  table: async ({ browser }, use, testInfo) => {
    const contexts: BrowserContext[] = [];
    await use(async (n, opts) => {
      const characters = opts?.characters ?? CHARACTERS;
      const players: PlayerHandle[] = [];
      let code = "";
      for (let i = 0; i < n; i++) {
        const u = testInfo.project.use;
        const context = await browser.newContext({
          ...(u.viewport ? { viewport: u.viewport } : {}),
          ...(u.userAgent ? { userAgent: u.userAgent } : {}),
          ...(u.deviceScaleFactor ? { deviceScaleFactor: u.deviceScaleFactor } : {}),
          isMobile: u.isMobile ?? false,
          hasTouch: u.hasTouch ?? false,
          baseURL: u.baseURL ?? "http://127.0.0.1:5174",
          locale: "en-US",
        });
        contexts.push(context);
        const page = await context.newPage();
        const join = new JoinPage(page);
        const name = NAMES[i]!;
        if (i === 0) code = await join.createRoom(name);
        else {
          await join.joinRoom(name, code);
          await expect(page.getByText(`room: ${code}`)).toBeVisible();
        }
        players.push({ name, page, context, lobby: new LobbyPage(page), game: new GamePage(page) });
      }
      for (let i = 0; i < n; i++) await players[i]!.lobby.chooseCharacter(characters[i]!);
      return {
        code,
        players,
        start: async () => {
          const host = players[0]!;
          await expect(host.lobby.startButton()).toBeEnabled();
          await host.lobby.startButton().click();
          for (const p of players) await p.game.expectInGame();
        },
      };
    });
    for (const c of contexts) await c.close();
  },
});

export { expect };
