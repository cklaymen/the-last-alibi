import { describe, expect, it } from "vitest";
import { makeSuggestion, resolveAway } from "../src/index.js";
import { constRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

const RED = pid("red");
const YELLOW = pid("yellow");
const BLUE = pid("blue");

function threePlayers() {
  return withState(started(["red", "yellow", "blue"]), {
    envelope: { suspect: "purple", weapon: "wrench", room: "study" },
    hands: {
      [RED]: ["red", "candlestick", "kitchen"],
      [YELLOW]: ["yellow", "dagger", "hall", "rope"],
      [BLUE]: ["blue", "revolver", "library"],
    },
  });
}

describe("resolveAway", () => {
  it("does nothing when nobody relevant is away", () => {
    const g = threePlayers();
    expect(resolveAway(g, [], constRng())).toBe(g);
    expect(resolveAway(g, [BLUE], constRng())).toBe(g);
  });

  it("skips the turn of an away active player (and of following away players)", () => {
    const g = resolveAway(threePlayers(), [RED, YELLOW], constRng());
    expect(play(g).turn.playerId).toBe(BLUE);
    expect(play(g).events.slice(-2)).toEqual([
      { type: "turn_skipped", playerId: RED },
      { type: "turn_skipped", playerId: YELLOW },
    ]);
  });

  it("does not skip when every remaining player is away", () => {
    const g = threePlayers();
    expect(play(resolveAway(g, [RED, YELLOW, BLUE], constRng())).turn.playerId).toBe(RED);
  });

  it("an away disprover automatically shows a matching card", () => {
    const g0 = withState(threePlayers(), {
      pawns: { red: room("hall") },
      turn: { suggestionRoom: "hall" },
    });
    const g1 = unwrap(makeSuggestion(g0, RED, "purple", "rope"));
    expect(play(g1).turn.pendingSuggestion?.disproverId).toBe(YELLOW);
    const g2 = resolveAway(g1, [YELLOW], constRng(0.99));
    expect(play(g2).turn.pendingSuggestion).toBeNull();
    expect(play(g2).reveals).toEqual([{ toPlayerId: RED, fromPlayerId: YELLOW, cardId: "rope" }]);
    expect(play(g2).turn.playerId).toBe(RED);
  });

  it("an away suggester's turn is skipped only after the disprove is resolved", () => {
    const g0 = withState(threePlayers(), {
      pawns: { red: room("hall") },
      turn: { suggestionRoom: "hall" },
    });
    const g1 = unwrap(makeSuggestion(g0, RED, "purple", "rope"));
    expect(resolveAway(g1, [RED], constRng())).toBe(g1);
    expect(play(resolveAway(g1, [RED, YELLOW], constRng())).turn.playerId).toBe(BLUE);
  });
});
