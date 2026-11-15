import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testGame, testRoom } from "../../test/renderWithGame.js";
import { GameOverScreen } from "./GameOverScreen.js";

const finished = {
  ...testGame,
  status: "FINISHED" as const,
  envelope: { suspect: "green" as const, weapon: "rope" as const, room: "hall" as const },
};

describe("GameOverScreen", () => {
  it("shows my win, the envelope and lets the host restart", async () => {
    const { value } = renderWithGame(<GameOverScreen />, {
      room: { ...testRoom, phase: "FINISHED" },
      game: { ...finished, winner: { playerId: "p1", reason: "ACCUSATION" } },
    });
    expect(screen.getByRole("heading", { name: "You win!" })).toBeInTheDocument();
    const envelope = screen.getByRole("region", { name: "Envelope" });
    expect(within(envelope).getByText("Mr. Green")).toBeInTheDocument();
    expect(within(envelope).getByText("Rope")).toBeInTheDocument();
    expect(within(envelope).getByText("Hall")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(value.send).toHaveBeenCalledWith("room:restart", {});
  });

  it("shows the other winner, last-standing note; non-host has no Play again", async () => {
    const { value } = renderWithGame(<GameOverScreen />, {
      myId: "p2",
      room: { ...testRoom, phase: "FINISHED" },
      game: { ...finished, winner: { playerId: "p1", reason: "LAST_STANDING" } },
    });
    expect(screen.getByRole("heading", { name: "Alice wins!" })).toBeInTheDocument();
    expect(screen.getByText("Last detective standing.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play again" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Back to menu" }));
    expect(value.leave).toHaveBeenCalled();
  });
});
