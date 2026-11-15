import { describe, expect, it } from "vitest";
import {
  disprove,
  endTurn,
  makeAccusation,
  makeSuggestion,
  matchingCards,
  movePawn,
  rollDice,
  type CardId,
  type Game,
} from "../src/index.js";
import { cell, codeOf, diceRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

const RED = pid("red");
const WHITE = pid("white");
const GREEN = pid("green");
const BLUE = pid("blue");

// turn order: red, white, green, blue
const hands: Record<string, CardId[]> = {
  [RED]: ["rope", "lounge"],
  [WHITE]: ["kitchen", "candlestick"],
  [GREEN]: ["hall", "dagger", "purple"],
  [BLUE]: ["purple", "library"],
};

function inHall(extra: Parameters<typeof withState>[1] = {}): Game {
  return withState(started(["blue", "green", "white", "red"]), {
    pawns: { red: room("hall") },
    turn: { suggestionRoom: "hall" },
    hands,
    envelope: { suspect: "yellow", weapon: "wrench", room: "study" },
    ...extra,
  });
}

describe("matchingCards", () => {
  it("returns hand cards named in the suggestion, in hand order", () => {
    expect(
      matchingCards(["hall", "rope", "purple", "kitchen"], { suspect: "purple", weapon: "rope", room: "hall" }),
    ).toEqual(["hall", "rope", "purple"]);
    expect(matchingCards(["kitchen"], { suspect: "purple", weapon: "rope", room: "hall" })).toEqual([]);
  });
});

describe("makeSuggestion — when allowed", () => {
  it("allowed in the room entered this turn by moving", () => {
    let g = started(["red", "blue"]);
    g = unwrap(rollDice(g, RED, diceRng(6, 6)));
    g = unwrap(movePawn(g, RED, room("lounge")));
    const s = unwrap(makeSuggestion(g, RED, "blue", "rope"));
    expect(play(s).events.find((e) => e.type === "suggested")).toEqual({
      type: "suggested",
      playerId: RED,
      suggestion: { suspect: "blue", weapon: "rope", room: "lounge" },
    });
  });

  it("staying in a room without moving does not allow a suggestion", () => {
    const g = inHall({ turn: { suggestionRoom: null } });
    expect(codeOf(makeSuggestion(g, RED, "purple", "rope"))).toBe("CANNOT_SUGGEST");
    const afterRoll = unwrap(rollDice(g, RED, diceRng(1, 1)));
    expect(codeOf(makeSuggestion(afterRoll, RED, "purple", "rope"))).toBe("CANNOT_SUGGEST");
  });

  it("not allowed on a corridor cell or in a room other than suggestionRoom", () => {
    expect(codeOf(makeSuggestion(inHall({ pawns: { red: cell(7, 7) } }), RED, "purple", "rope"))).toBe(
      "CANNOT_SUGGEST",
    );
    expect(codeOf(makeSuggestion(inHall({ pawns: { red: room("study") } }), RED, "purple", "rope"))).toBe(
      "CANNOT_SUGGEST",
    );
  });

  it("only one suggestion per turn", () => {
    const g = unwrap(makeSuggestion(inHall({ hands: {} }), RED, "yellow", "wrench"));
    expect(codeOf(makeSuggestion(g, RED, "yellow", "wrench"))).toBe("CANNOT_SUGGEST");
  });

  it("common guards apply", () => {
    expect(codeOf(makeSuggestion(inHall(), WHITE, "purple", "rope"))).toBe("NOT_YOUR_TURN");
    expect(codeOf(makeSuggestion(inHall({ eliminated: [RED] }), RED, "purple", "rope"))).toBe(
      "PLAYER_ELIMINATED",
    );
  });
});

describe("makeSuggestion — effects", () => {
  it("moves the suspect pawn and weapon into the room", () => {
    const p = play(unwrap(makeSuggestion(inHall(), RED, "purple", "rope")));
    expect(p.pawns.purple).toEqual(room("hall"));
    expect(p.weapons.rope).toBe("hall");
    expect(p.turn.hasSuggested).toBe(true);
  });

  it("an unplayed suspect pawn is moved but nobody is summoned", () => {
    const p = play(unwrap(makeSuggestion(inHall(), RED, "purple", "rope")));
    expect(p.summonedTo).toEqual({});
  });

  it("summons another participating player's pawn", () => {
    const p = play(unwrap(makeSuggestion(inHall(), RED, "white", "rope")));
    expect(p.pawns.white).toEqual(room("hall"));
    expect(p.summonedTo).toEqual({ [WHITE]: "hall" });
  });

  it("does not summon a pawn already in the room, nor the suggester", () => {
    const already = inHall({ pawns: { red: room("hall"), white: room("hall") } });
    expect(play(unwrap(makeSuggestion(already, RED, "white", "rope"))).summonedTo).toEqual({});
    expect(play(unwrap(makeSuggestion(inHall(), RED, "red", "rope"))).summonedTo).toEqual({});
  });

  it("a summoned player can suggest on their next turn without moving", () => {
    let g = unwrap(makeSuggestion(inHall({ hands: {} }), RED, "white", "rope"));
    g = unwrap(endTurn(g, RED));
    const p = play(g);
    expect(p.turn.playerId).toBe(WHITE);
    expect(p.turn.suggestionRoom).toBe("hall");
    expect(p.summonedTo).toEqual({});
    expect(codeOf(makeSuggestion(g, WHITE, "green", "dagger"))).toBe("OK");
  });

  it("a summoned player who moves out loses the summoned room", () => {
    let g = unwrap(makeSuggestion(inHall({ hands: {} }), RED, "white", "rope"));
    g = unwrap(endTurn(g, RED));
    g = unwrap(rollDice(g, WHITE, diceRng(1, 1)));
    g = unwrap(movePawn(g, WHITE, cell(17, 11)));
    expect(codeOf(makeSuggestion(g, WHITE, "green", "dagger"))).toBe("CANNOT_SUGGEST");
  });
});

describe("disprover resolution", () => {
  it("asks clockwise, auto-passing players without matching cards", () => {
    const p = play(unwrap(makeSuggestion(inHall(), RED, "purple", "rope")));
    // white has nothing, green has hall + purple
    expect(p.events.slice(-2)).toEqual([
      { type: "suggested", playerId: RED, suggestion: { suspect: "purple", weapon: "rope", room: "hall" } },
      { type: "cannot_disprove", playerId: WHITE },
    ]);
    expect(p.turn.pendingSuggestion).toEqual({
      suggesterId: RED,
      suggestion: { suspect: "purple", weapon: "rope", room: "hall" },
      disproverId: GREEN,
    });
  });

  it("wraps around the turn order past the end", () => {
    const g = inHall({
      pawns: { blue: room("hall") },
      turn: { playerId: BLUE, suggestionRoom: "hall" },
      hands: { [RED]: [], [WHITE]: ["rope"], [GREEN]: ["hall"], [BLUE]: ["rope"] },
    });
    const p = play(unwrap(makeSuggestion(g, BLUE, "purple", "rope")));
    expect(p.events.filter((e) => e.type === "cannot_disprove")).toEqual([
      { type: "cannot_disprove", playerId: RED },
    ]);
    expect(p.turn.pendingSuggestion?.disproverId).toBe(WHITE);
  });

  it("includes eliminated players in the queue", () => {
    const p = play(unwrap(makeSuggestion(inHall({ eliminated: [GREEN] }), RED, "purple", "rope")));
    expect(p.turn.pendingSuggestion?.disproverId).toBe(GREEN);
  });

  it("nobody can disprove: no_one_disproved, nothing pending (suggester's own cards ignored)", () => {
    const g = inHall({ hands: { ...hands, [GREEN]: ["dagger"] } });
    const p = play(unwrap(makeSuggestion(g, RED, "yellow", "rope")));
    expect(p.events.slice(-4)).toEqual([
      { type: "cannot_disprove", playerId: WHITE },
      { type: "cannot_disprove", playerId: GREEN },
      { type: "cannot_disprove", playerId: BLUE },
      { type: "no_one_disproved", suggesterId: RED },
    ]);
    expect(p.turn.pendingSuggestion).toBeNull();
  });
});

describe("disprove", () => {
  const pending = () => unwrap(makeSuggestion(inHall(), RED, "purple", "rope"));

  it("only the designated disprover may show", () => {
    expect(codeOf(disprove(pending(), BLUE, "purple"))).toBe("NOT_YOUR_DISPROVE");
    expect(codeOf(disprove(pending(), RED, "rope"))).toBe("NOT_YOUR_DISPROVE");
    expect(codeOf(disprove(inHall(), GREEN, "hall"))).toBe("NOT_YOUR_DISPROVE");
  });

  it("must show a matching card from own hand", () => {
    expect(codeOf(disprove(pending(), GREEN, "dagger"))).toBe("CARD_NOT_MATCHING");
    expect(codeOf(disprove(pending(), GREEN, "rope"))).toBe("CARD_NOT_MATCHING");
  });

  it("records a private reveal and a public event without the card", () => {
    const p = play(unwrap(disprove(pending(), GREEN, "purple")));
    expect(p.reveals).toEqual([{ toPlayerId: RED, fromPlayerId: GREEN, cardId: "purple" }]);
    expect(p.events.at(-1)).toEqual({ type: "card_shown", playerId: GREEN, toPlayerId: RED });
    expect(JSON.stringify(p.events)).not.toContain('"cardId"');
    expect(p.turn.pendingSuggestion).toBeNull();
    expect(p.turn.playerId).toBe(RED);
  });

  it("an eliminated player still disproves", () => {
    const g = unwrap(makeSuggestion(inHall({ eliminated: [GREEN] }), RED, "purple", "rope"));
    expect(codeOf(disprove(g, GREEN, "hall"))).toBe("OK");
  });

  it("the suggester is blocked while pending, free afterwards", () => {
    const g = pending();
    expect(codeOf(endTurn(g, RED))).toBe("DISPROVE_PENDING");
    expect(codeOf(makeAccusation(g, RED, { suspect: "yellow", weapon: "wrench", room: "study" }))).toBe(
      "DISPROVE_PENDING",
    );
    const done = unwrap(disprove(g, GREEN, "hall"));
    expect(codeOf(endTurn(done, RED))).toBe("OK");
  });

  it("is rejected when the game is not in progress", () => {
    expect(codeOf(disprove({ ...pending(), phase: "FINISHED" }, GREEN, "hall"))).toBe("GAME_NOT_IN_PROGRESS");
  });
});
