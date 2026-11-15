import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testRoom } from "../../test/renderWithGame.js";
import { LobbyScreen } from "./LobbyScreen.js";

const lobby = {
  ...testRoom,
  phase: "LOBBY" as const,
  players: [
    { id: "p1", name: "Alice", characterId: "red" as const },
    { id: "p2", name: "Bob" },
  ],
};

describe("LobbyScreen", () => {
  it("host sees a disabled Start game until everyone chose", () => {
    renderWithGame(<LobbyScreen />, { room: lobby, game: null, me: null });
    expect(screen.getByText("room: 1234")).toBeInTheDocument();
    const players = screen.getByRole("region", { name: "Players" });
    expect(within(players).getByText("Alice")).toBeInTheDocument();
    expect(within(players).getByRole("img", { name: "Ms. Red" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start game" })).toBeDisabled();
  });

  it("marks my character pressed, others' taken; non-host waits", async () => {
    const send = vi.fn(async () => ({ ok: false as const, code: "CHARACTER_TAKEN" as const }));
    renderWithGame(<LobbyScreen />, {
      room: { ...lobby, players: [lobby.players[0]!, { id: "p2", name: "Bob", characterId: "blue" }] },
      myId: "p2",
      game: null,
      me: null,
      send,
    });
    const picker = screen.getByRole("region", { name: "Select character" });
    expect(within(picker).getByRole("button", { name: "Mrs. Blue" })).toHaveAttribute("aria-pressed", "true");
    expect(within(picker).getByRole("button", { name: "Ms. Red" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Waiting for host" })).toBeDisabled();
    await userEvent.click(within(picker).getByRole("button", { name: "Mr. Green" }));
    expect(send).toHaveBeenCalledWith("room:choose_character", { characterId: "green" });
    expect(await screen.findByRole("alert")).toHaveTextContent("This character is already taken.");
  });
});
