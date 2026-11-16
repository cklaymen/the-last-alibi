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

  settings() {
    return this.page.getByRole("region", { name: "Room settings" });
  }

  /** A room-settings control (select or checkbox) by its exact EN label. */
  setting(label: string) {
    return this.settings().getByLabel(label, { exact: true });
  }

  /** Text of the selected option of a room-settings select. */
  selected(label: string) {
    return this.setting(label).locator("option:checked");
  }
}
