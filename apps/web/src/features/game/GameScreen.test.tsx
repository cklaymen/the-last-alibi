import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { GameContext, type GameContextValue } from "./GameContext.js";
import { GameScreen } from "./GameScreen.js";
import { makeGame, makeMe } from "./testFixtures.js";

function renderScreen(overrides: Partial<GameContextValue> = {}) {
  const value: GameContextValue = {
    room: { id: "g1", code: "ABCD", hostId: "p1", maxPlayers: 6, phase: "IN_PROGRESS", players: [], lastResult: null },
    myId: "p1",
    game: makeGame(),
    me: makeMe(),
    connected: true,
    send: vi.fn().mockResolvedValue({ ok: true }),
    leave: vi.fn(),
    ...overrides,
  };
  return render(
    <GameContext.Provider value={value}>
      <GameScreen />
    </GameContext.Provider>,
  );
}

describe("GameScreen", () => {
  it("shows a loading text until both states exist", () => {
    renderScreen({ me: null });
    expect(screen.getByText("Loading game…")).toBeInTheDocument();
  });

  it("renders board, players, hand and event log", () => {
    renderScreen();
    expect(screen.getByRole("region", { name: "Board" })).toBeInTheDocument();
    const players = within(screen.getByRole("region", { name: "Players" })).getAllByRole("listitem");
    expect(players).toHaveLength(3);
    expect(players[0]).toHaveAttribute("aria-current", "true");
    const hand = within(screen.getByRole("region", { name: "Your cards" })).getAllByRole("listitem");
    expect(hand.map((li) => li.textContent)).toEqual(["Mr. Green", "Rope", "Hall"]);
    expect(screen.getByRole("region", { name: "Event log" })).toBeInTheDocument();
    expect(screen.queryByText(/You are out/)).toBeNull();
  });

  it("renders Actions, Event log and Notebook in this DOM order", () => {
    renderScreen();
    const regions = screen
      .getAllByRole("region")
      .map((el) => el.getAttribute("aria-label"))
      .filter((name) => name === "Actions" || name === "Event log" || name === "Notebook");
    expect(regions).toEqual(["Actions", "Event log", "Notebook"]);
    expect(screen.queryByRole("button", { name: "Notebook" })).toBeNull();
  });

  it("Actions has data-attention=\"action\" on my turn", () => {
    renderScreen({ me: makeMe({ availableActions: ["roll", "accuse"] }) });
    expect(screen.getByRole("region", { name: "Actions" })).toHaveAttribute("data-attention", "action");
  });

  it("Actions has data-attention=\"none\" when I have nothing to do", () => {
    renderScreen();
    expect(screen.getByRole("region", { name: "Actions" })).toHaveAttribute("data-attention", "none");
  });

  it("shows the eliminated banner and my envelope", () => {
    const game = makeGame();
    game.players[0] = { ...game.players[0]!, eliminated: true };
    renderScreen({
      game,
      me: makeMe({ envelope: { suspect: "purple", weapon: "dagger", room: "study" } }),
    });
    expect(screen.getByText("You are out – you still have to show cards.")).toBeInTheDocument();
    const env = screen.getByRole("region", { name: "Envelope" });
    expect(env).toHaveTextContent("Prof. Purple");
    expect(env).toHaveTextContent("Dagger");
    expect(env).toHaveTextContent("Study");
    expect(screen.getAllByText("out").length).toBeGreaterThan(0);
  });
});
