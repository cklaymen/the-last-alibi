import { expect, type Page } from "@playwright/test";

export class GamePage {
  constructor(readonly page: Page) {}

  board() {
    return this.page.getByRole("region", { name: "Board" });
  }

  hand() {
    return this.page.getByRole("region", { name: "Your cards" });
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
    await expect(this.hand()).toBeVisible();
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

  async accuse(suspect: string, weapon: string, room: string): Promise<void> {
    await this.action("Accuse").click();
    await this.pick("Make an accusation", "Suspect", suspect);
    await this.pick("Make an accusation", "Weapon", weapon);
    await this.pick("Make an accusation", "Room", room);
    await this.page.getByRole("button", { name: "Confirm accusation" }).click();
  }
}
