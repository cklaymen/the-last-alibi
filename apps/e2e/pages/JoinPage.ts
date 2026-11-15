import { expect, type Page } from "@playwright/test";

export class JoinPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/");
  }

  async createRoom(nickname: string): Promise<string> {
    await this.open();
    await this.page.getByLabel("Your nickname").fill(nickname);
    await this.page.getByRole("button", { name: "Create room" }).click();
    const label = this.page.getByText(/room: \d{6}/);
    await expect(label).toBeVisible();
    const code = (await label.textContent())?.match(/\d{6}/)?.[0] ?? "";
    expect(code).toMatch(/^\d{6}$/);
    return code;
  }

  async joinRoom(nickname: string, code: string): Promise<void> {
    await this.open();
    await this.page.getByLabel("Your nickname").fill(nickname);
    await this.page.getByRole("button", { name: "Join room" }).click();
    await this.page.getByLabel("Room code").fill(code);
    await this.page.getByRole("button", { name: "Join room" }).click();
  }
}
