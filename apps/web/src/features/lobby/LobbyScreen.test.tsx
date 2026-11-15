import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testRoom } from "../../test/renderWithGame.js";
import { LobbyScreen } from "./LobbyScreen.js";

const lobby = {
  ...testRoom,
  phase: "LOBBY" as const,
  players: [
    { id: "p1", name: "Alice", characterId: "red" as const, presence: "online" as const },
    { id: "p2", name: "Bob", presence: "online" as const },
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
      room: { ...lobby, players: [lobby.players[0]!, { id: "p2", name: "Bob", characterId: "blue", presence: "online" }] },
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

  it("host can remove other players (not self) and sees errors", async () => {
    const send = vi.fn(async () => ({ ok: false as const, code: "NOT_HOST" as const }));
    renderWithGame(<LobbyScreen />, { room: lobby, game: null, me: null, send });
    const players = screen.getByRole("region", { name: "Players" });
    expect(within(players).queryByRole("button", { name: "Remove Alice" })).toBeNull();
    await userEvent.click(within(players).getByRole("button", { name: "Remove Bob" }));
    expect(send).toHaveBeenCalledWith("room:kick", { playerId: "p2" });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("non-host has no remove buttons", () => {
    renderWithGame(<LobbyScreen />, { room: lobby, myId: "p2", game: null, me: null });
    expect(screen.queryByRole("button", { name: /^Remove / })).toBeNull();
  });

  it("shows offline presence", () => {
    renderWithGame(<LobbyScreen />, {
      room: { ...lobby, players: [lobby.players[0]!, { ...lobby.players[1]!, presence: "offline" }] },
      game: null,
      me: null,
    });
    const players = screen.getByRole("region", { name: "Players" });
    expect(within(players).getAllByText("offline")).toHaveLength(1);
  });

  it("shows the last game with winner and envelope", () => {
    const envelope = { suspect: "green", weapon: "rope", room: "hall" } as const;
    const { unmount } = renderWithGame(<LobbyScreen />, {
      room: { ...lobby, lastResult: { winnerId: "p1", winnerName: "Alice", reason: "ACCUSATION", envelope } },
      game: null,
      me: null,
    });
    const last = screen.getByRole("region", { name: "Last game" });
    expect(within(last).getByRole("heading", { name: "You win!" })).toBeInTheDocument();
    expect(within(last).queryByText("Last detective standing.")).toBeNull();
    const env = within(last).getByRole("region", { name: "Envelope" });
    expect(within(env).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Mr. Green", "Rope", "Hall"]);
    unmount();

    renderWithGame(<LobbyScreen />, {
      myId: "p2",
      room: { ...lobby, lastResult: { winnerId: "p1", winnerName: "Alice", reason: "LAST_STANDING", envelope } },
      game: null,
      me: null,
    });
    const last2 = screen.getByRole("region", { name: "Last game" });
    expect(within(last2).getByRole("heading", { name: "Alice wins!" })).toBeInTheDocument();
    expect(within(last2).getByText("Last detective standing.")).toBeInTheDocument();
  });

  it("has no last game region without a result", () => {
    renderWithGame(<LobbyScreen />, { room: lobby, game: null, me: null });
    expect(screen.queryByRole("region", { name: "Last game" })).toBeNull();
  });
});
