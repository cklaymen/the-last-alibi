import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame } from "../../test/renderWithGame.js";
import { AccusationDialog } from "./AccusationDialog.js";

describe("AccusationDialog", () => {
  it("AccusationDialog locks the room", async () => {
    const onSubmit = vi.fn();
    renderWithGame(<AccusationDialog lockedRoom="lounge" onSubmit={onSubmit} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Make an accusation" });
    const rooms = within(dialog).getByRole("radiogroup", { name: "Room" });
    const lounge = within(rooms).getByRole("radio", { name: "Lounge" });
    expect(lounge).toBeChecked();
    expect(lounge).toBeDisabled();
    const hall = within(rooms).getByRole("radio", { name: "Hall" });
    expect(hall).toBeDisabled();
    expect(hall).not.toBeChecked();

    await userEvent.click(within(dialog).getByRole("radio", { name: "Col. Yellow" }));
    await userEvent.click(within(dialog).getByRole("radio", { name: "Wrench" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm accusation" }));
    expect(onSubmit).toHaveBeenCalledWith({ suspect: "yellow", weapon: "wrench", room: "lounge" });
  });

  it("without a locked room every room can be chosen", () => {
    renderWithGame(<AccusationDialog onSubmit={vi.fn()} onClose={vi.fn()} />);
    const rooms = screen.getByRole("radiogroup", { name: "Room" });
    for (const radio of within(rooms).getAllByRole("radio")) {
      expect(radio).toBeEnabled();
      expect(radio).not.toBeChecked();
    }
  });
});
