import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testRoom } from "../../test/renderWithGame.js";
import { NicknameButton } from "./NicknameButton.js";
import { loadNickname, NICKNAME_KEY, saveNickname } from "./storage.js";

describe("nickname memory", () => {
  it("remembers the trimmed nickname in localStorage", () => {
    expect(loadNickname()).toBe("");
    saveNickname("  Ada ");
    expect(localStorage.getItem(NICKNAME_KEY)).toBe("Ada");
    expect(loadNickname()).toBe("Ada");
    saveNickname("   ");
    expect(loadNickname()).toBe("Ada");
  });
});

describe("NicknameButton + rename dialog", () => {
  it("shows my nickname, renames via room:rename and remembers it", async () => {
    const user = userEvent.setup();
    const { value } = renderWithGame(<NicknameButton />);
    const button = screen.getByRole("button", { name: "Change nickname" });
    expect(button).toHaveTextContent("Alice");

    await user.click(button);
    const dialog = screen.getByRole("dialog", { name: "Change nickname" });
    const field = screen.getByRole("textbox", { name: "Nickname" });
    expect(field).toHaveValue("Alice");
    await user.clear(field);
    await user.type(field, "Alicja");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(value.send).toHaveBeenCalledWith("room:rename", { name: "Alicja" });
    expect(dialog).not.toBeInTheDocument();
    expect(loadNickname()).toBe("Alicja");
  });

  it("shows NAME_TAKEN inside the dialog and keeps it open", async () => {
    const user = userEvent.setup();
    const send = vi.fn(async () => ({ ok: false as const, code: "NAME_TAKEN" as const }));
    renderWithGame(<NicknameButton />, { send });
    await user.click(screen.getByRole("button", { name: "Change nickname" }));
    const field = screen.getByRole("textbox", { name: "Nickname" });
    await user.clear(field);
    await user.type(field, "Bob{Enter}");
    const dialog = screen.getByRole("dialog", { name: "Change nickname" });
    expect(dialog).toContainElement(
      screen.getByRole("alert"),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This nickname is already taken in this room.");
    expect(loadNickname()).toBe("");
  });

  it("Cancel closes without sending; too short names cannot be saved", async () => {
    const user = userEvent.setup();
    const { value } = renderWithGame(<NicknameButton />, { room: testRoom });
    await user.click(screen.getByRole("button", { name: "Change nickname" }));
    const field = screen.getByRole("textbox", { name: "Nickname" });
    await user.clear(field);
    await user.type(field, "A");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(value.send).not.toHaveBeenCalled();
  });
});
