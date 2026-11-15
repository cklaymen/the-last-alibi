import { expect, type Page } from "@playwright/test";

export class LobbyPage {
  constructor(readonly page: Page) {}

  players() {
    return this.page.getByRole("region", { name: "Players" });
  }

  character(name: string) {
    return this.page
      .getByRole("region", { name: "Select character" })
      .getByRole("button", { name });
  }

  async chooseCharacter(name: string): Promise<void> {
    await this.character(name).click();
    await expect(this.character(name)).toHaveAttribute("aria-pressed", "true");
  }

  startButton() {
    return this.page.getByRole("button", { name: "Start game" });
  }
}
