import { describe, expect, it } from "vitest";
import { autoDisprove, makeSuggestion, timeOutTurn } from "../src/index.js";
import { codeOf, constRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

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

function suggested() {
  const g0 = withState(threePlayers(), {
    pawns: { red: room("hall") },
    turn: { suggestionRoom: "hall" },
  });
  return unwrap(makeSuggestion(g0, RED, "purple", "rope"));
}

describe("timeOutTurn", () => {
  it("passes the turn and emits turn_timed_out", () => {
    const g = unwrap(timeOutTurn(threePlayers(), RED));
    expect(play(g).turn.playerId).toBe(YELLOW);
    expect(play(g).events.at(-1)).toEqual({ type: "turn_timed_out", playerId: RED });
    expect(play(g).events.some((e) => e.type === "turn_ended")).toBe(false);
  });

  it("fails DISPROVE_PENDING while a disprove is pending", () => {
    expect(codeOf(timeOutTurn(suggested(), RED))).toBe("DISPROVE_PENDING");
  });

  it("fails NOT_YOUR_TURN for another player", () => {
    expect(codeOf(timeOutTurn(threePlayers(), YELLOW))).toBe("NOT_YOUR_TURN");
  });

  it("fails GAME_NOT_IN_PROGRESS in the lobby", () => {
    const g = { ...threePlayers(), phase: "LOBBY" as const, play: null };
    expect(codeOf(timeOutTurn(g, RED))).toBe("GAME_NOT_IN_PROGRESS");
  });
});

describe("autoDisprove", () => {
  it("timeout shows one matching card, emits disprove_timed_out then card_shown", () => {
    const g1 = suggested();
    expect(play(g1).turn.pendingSuggestion?.disproverId).toBe(YELLOW);
    const g2 = unwrap(autoDisprove(g1, constRng(0.99), "timeout"));
    expect(play(g2).turn.pendingSuggestion).toBeNull();
    expect(play(g2).reveals).toEqual([{ toPlayerId: RED, fromPlayerId: YELLOW, cardId: "rope" }]);
    expect(play(g2).events.slice(-2)).toEqual([
      { type: "disprove_timed_out", playerId: YELLOW },
      { type: "card_shown", playerId: YELLOW, toPlayerId: RED },
    ]);
    expect(play(g2).turn.playerId).toBe(RED);
  });

  it("picks the card using the injected rng", () => {
    const g0 = withState(suggested(), {
      hands: { [RED]: [], [YELLOW]: ["hall", "rope"], [BLUE]: [] },
    });
    const g = unwrap(autoDisprove(g0, constRng(0), "timeout"));
    expect(play(g).reveals.at(-1)?.cardId).toBe("hall");
  });

  it("away reason does not emit disprove_timed_out", () => {
    const g = unwrap(autoDisprove(suggested(), constRng(0), "away"));
    expect(play(g).events.at(-1)).toEqual({ type: "card_shown", playerId: YELLOW, toPlayerId: RED });
    expect(play(g).events.some((e) => e.type === "disprove_timed_out")).toBe(false);
  });

  it("fails NOT_YOUR_DISPROVE when no disprove is pending", () => {
    expect(codeOf(autoDisprove(threePlayers(), constRng(), "timeout"))).toBe("NOT_YOUR_DISPROVE");
  });

  it("fails GAME_NOT_IN_PROGRESS in the lobby", () => {
    const g = { ...threePlayers(), phase: "LOBBY" as const, play: null };
    expect(codeOf(autoDisprove(g, constRng(), "timeout"))).toBe("GAME_NOT_IN_PROGRESS");
  });
});
