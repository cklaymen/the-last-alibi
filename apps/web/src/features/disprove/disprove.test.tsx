import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameEvent, PublicGameState } from "@mystery-game/contracts";
import { makeGame, makeMe } from "../game/testFixtures.js";
import { DisprovePanel } from "./DisprovePanel.js";
import { SeenCards } from "./SeenCards.js";
import { currentTurnSuggestion, suggestionOutcome } from "./selectors.js";
import { SuggestionResult } from "./SuggestionResult.js";

const triple = { suspect: "red", weapon: "rope", room: "kitchen" } as const;
const withEvents = (events: GameEvent[], extra: Partial<PublicGameState> = {}) =>
  makeGame({ events: events.map((event, seq) => ({ seq, event })), ...extra });

describe("currentTurnSuggestion", () => {
  it("returns the last suggestion of the current turn", () => {
    const game = withEvents([
      { type: "turn_ended", playerId: "p3" },
      { type: "suggested", playerId: "p1", suggestion: triple },
    ]);
    expect(currentTurnSuggestion(game)).toEqual({ suggesterId: "p1", suggestion: triple });
  });

  it("is null after turn_ended, turn_skipped or turn_timed_out", () => {
    for (const type of ["turn_ended", "turn_skipped", "turn_timed_out"] as const) {
      const game = withEvents([
        { type: "suggested", playerId: "p1", suggestion: triple },
        { type: "no_one_disproved", suggesterId: "p1" },
        { type, playerId: "p1" },
      ]);
      expect(currentTurnSuggestion(game)).toBeNull();
    }
  });
});

describe("suggestionOutcome", () => {
  const seen = makeMe({ seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });

  it("none for suggester", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "no_one_disproved", suggesterId: "p1" },
    ]);
    expect(suggestionOutcome(game, makeMe())).toEqual({ kind: "none", suggesterId: "p1" });
  });

  it("shown with card for suggester", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
    ]);
    expect(suggestionOutcome(game, seen)).toEqual({
      kind: "shown",
      suggesterId: "p1",
      byId: "p2",
      cardId: "dagger",
    });
  });

  it("shown without card for others", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
    ]);
    const other = makeMe({ playerId: "p3", seenCards: [{ cardId: "rope", fromPlayerId: "p2" }] });
    expect(suggestionOutcome(game, other)).toEqual({
      kind: "shown",
      suggesterId: "p1",
      byId: "p2",
      cardId: null,
    });
  });

  it("null after turn_ended", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
      { type: "turn_ended", playerId: "p1" },
    ]);
    expect(suggestionOutcome(game, seen)).toBeNull();
    expect(suggestionOutcome(makeGame(), seen)).toBeNull();
  });

  it("pending while waiting", () => {
    const game = withEvents([{ type: "suggested", playerId: "p1", suggestion: triple }], {
      turn: {
        playerId: "p1",
        dice: null,
        hasMoved: false,
        pendingSuggestion: { suggesterId: "p1", suggestion: triple, disproverId: "p3" },
      },
    });
    expect(suggestionOutcome(game, seen)).toEqual({ kind: "pending", suggesterId: "p1", disproverId: "p3" });
  });
});

describe("SuggestionResult", () => {
  const shown = withEvents([
    { type: "suggested", playerId: "p1", suggestion: triple },
    { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
  ]);

  it("shows the card to the suggester", () => {
    const me = makeMe({ seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });
    render(<SuggestionResult game={shown} me={me} />);
    const region = screen.getByRole("region", { name: "Suggestion result" });
    expect(within(region).getByText("Bob showed you a card:")).toBeInTheDocument();
    expect(within(region).getByText("Dagger")).toBeInTheDocument();
  });

  it("tells others who showed a card without revealing it", () => {
    const me = makeMe({ playerId: "p3", seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });
    render(<SuggestionResult game={shown} me={me} />);
    expect(screen.getByText("Bob showed a card to Alice")).toBeInTheDocument();
    expect(screen.queryByText("Dagger")).not.toBeInTheDocument();
  });

  it("reports that nobody could disprove", () => {
    const none = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "no_one_disproved", suggesterId: "p1" },
    ]);
    const { unmount } = render(<SuggestionResult game={none} me={makeMe()} />);
    expect(screen.getByText("Nobody could disprove")).toBeInTheDocument();
    unmount();
    render(<SuggestionResult game={none} me={makeMe({ playerId: "p2" })} />);
    expect(screen.getByText("Nobody could disprove Alice's suggestion")).toBeInTheDocument();
  });

  it("renders nothing without a result", () => {
    const { container } = render(<SuggestionResult game={makeGame()} me={makeMe()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DisprovePanel", () => {
  it("shows one button per matching card and sends the choice", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const me = makeMe({
      playerId: "p2",
      disproveRequest: { suggesterId: "p1", suggestion: triple, matchingCards: ["rope", "kitchen"] },
    });
    render(<DisprovePanel game={makeGame()} me={me} send={send} />);
    const region = screen.getByRole("region", { name: "Show a card" });
    expect(within(region).getByText("Show one card to Alice")).toBeInTheDocument();
    expect(within(region).getAllByRole("button")).toHaveLength(2);
    await userEvent.click(within(region).getByRole("button", { name: "Kitchen" }));
    expect(send).toHaveBeenCalledWith("turn:disprove", { cardId: "kitchen" });
  });

  it("renders nothing without a request", () => {
    const { container } = render(<DisprovePanel game={makeGame()} me={makeMe()} send={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SeenCards", () => {
  it("lists cards shown to me", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
    ]);
    const me = makeMe({ seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });
    render(<SeenCards game={game} me={me} />);
    const region = screen.getByRole("region", { name: "Cards shown to you" });
    expect(within(region).getByText("Dagger (from Bob)")).toBeInTheDocument();
  });
});
