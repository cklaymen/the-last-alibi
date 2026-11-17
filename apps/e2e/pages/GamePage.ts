import { expect, type Page } from "@playwright/test";

export class GamePage {
  constructor(readonly page: Page) {}

  board() {
    return this.page.getByRole("region", { name: "Board" });
  }

  notebook() {
    return this.page.getByRole("region", { name: "Cards" });
  }

  /** Rows of my own cards in the notebook table. */
  hand() {
    return this.notebook().locator("tr[data-in-hand]");
  }

  /** A notebook cell button by card, column ("Overall" or a player name) and state. */
  notebookCell(card: string, column: string, state: string) {
    return this.notebook().getByRole("button", { name: new RegExp(`^${card} – ${column} – ${state} `) });
  }

  log() {
    return this.page.getByRole("region", { name: "Event log" });
  }

  turnStatus() {
    return this.page.getByRole("status").filter({ hasText: /turn/ });
  }

  action(name: string) {
    return this.page.getByRole("button", { name, exact: true });
  }

  pawn(character: string) {
    return this.board().getByRole("img", { name: new RegExp(`^${character} – `) });
  }

  async expectInGame(): Promise<void> {
    await expect(this.board()).toBeVisible();
    await expect(this.notebook()).toBeVisible();
  }

  async pick(dialog: string, group: string, option: string): Promise<void> {
    await this.page
      .getByRole("dialog", { name: dialog })
      .getByRole("radiogroup", { name: group })
      .getByRole("radio", { name: option })
      .click();
  }

  async suggest(suspect: string, weapon: string): Promise<void> {
    await this.action("Suggest").click();
    await this.pick("Make a suggestion", "Suspect", suspect);
    await this.pick("Make a suggestion", "Weapon", weapon);
    await this.page.getByRole("button", { name: "Confirm suggestion" }).click();
  }

  /** The sticky action section (turn panel, disprove panel, …). */
  actions() {
    return this.page.getByRole("region", { name: "Actions" });
  }

  /** A section of the game screen by its accessible name (e.g. "Event log", "Cards"). */
  section(name: string) {
    return this.page.getByRole("region", { name, exact: true });
  }

  /** The clickable header that collapses / expands a section ("Event log", "Cards"). */
  sectionToggle(title: string) {
    return this.page.locator("summary").filter({ hasText: title });
  }

  async accuse(suspect: string, weapon: string, room: string): Promise<void> {
    await this.action("Accuse").click();
    await this.pick("Make an accusation", "Suspect", suspect);
    await this.pick("Make an accusation", "Weapon", weapon);
    const roomRadio = this.page
      .getByRole("dialog", { name: "Make an accusation" })
      .getByRole("radiogroup", { name: "Room" })
      .getByRole("radio", { name: room });
    // With the "named room" rule the room is preselected and locked.
    if (await roomRadio.isEnabled()) await roomRadio.click();
    await this.page.getByRole("button", { name: "Confirm accusation" }).click();
  }
}
