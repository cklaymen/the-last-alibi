import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "./ThemeSwitcher.js";
import { setThemePreference } from "./theme.js";

describe("ThemeSwitcher", () => {
  it("marks the chosen theme as pressed", async () => {
    setThemePreference("system");
    render(<ThemeSwitcher />);
    expect(screen.getByRole("button", { name: "System theme" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "System theme" })).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.theme).toBe("dark");
    setThemePreference("system");
  });
});
