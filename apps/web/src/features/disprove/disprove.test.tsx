import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameEvent, PublicGameState } from "@mystery-game/contracts";
import { makeGame, makeMe } from "../game/testFixtures.js";
import { DisprovePanel } from "./DisprovePanel.js";
import { SeenCards } from "./SeenCards.js";
import { latestShownToMe } from "./selectors.js";

const triple = { suspect: "red", weapon: "rope", room: "kitchen" } as const;
const withEvents = (events: GameEvent[], extra: Partial<PublicGameState> = {}) =>
  makeGame({ events: events.map((event, seq) => ({ seq, event })), ...extra });

describe("latestShownToMe", () => {
  const me = makeMe({ seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });

  it("returns the card shown for my suggestion in my current turn", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
    ]);
    expect(latestShownToMe(game, me)).toEqual({ cardId: "dagger", fromPlayerId: "p2" });
  });

  it("is null after the turn ended or when nobody showed me a card", () => {
    expect(
      latestShownToMe(
        withEvents([
          { type: "suggested", playerId: "p1", suggestion: triple },
          { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
          { type: "turn_ended", playerId: "p1" },
        ]),
        me,
      ),
    ).toBeNull();
    expect(
      latestShownToMe(
        withEvents([
          { type: "suggested", playerId: "p1", suggestion: triple },
          { type: "no_one_disproved", suggesterId: "p1" },
        ]),
        me,
      ),
    ).toBeNull();
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
  it("lists cards shown to me and highlights the fresh one", () => {
    const game = withEvents([
      { type: "suggested", playerId: "p1", suggestion: triple },
      { type: "card_shown", playerId: "p2", toPlayerId: "p1" },
    ]);
    const me = makeMe({ seenCards: [{ cardId: "dagger", fromPlayerId: "p2" }] });
    render(<SeenCards game={game} me={me} />);
    const region = screen.getByRole("region", { name: "Cards shown to you" });
    expect(within(region).getByText("Dagger (from Bob)")).toBeInTheDocument();
    expect(within(region).getByText("Bob showed you: Dagger")).toBeInTheDocument();
  });
});
