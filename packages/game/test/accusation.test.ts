import { describe, expect, it } from "vitest";
import {
  availableActions,
  disprove,
  endTurn,
  makeAccusation,
  makeSuggestion,
  movePawn,
  reachableFor,
  rollDice,
  useSecretPassage,
  type CharacterId,
  type Game,
  type RoomSettings,
} from "../src/index.js";
import { accusationError } from "../src/accusation/index.js";
import { requireActivePlayer } from "../src/shared/guards.js";
import { cell, codeOf, diceRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

const envelope = { suspect: "yellow", weapon: "wrench", room: "study" } as const;
const wrong = { suspect: "purple", weapon: "rope", room: "hall" } as const;
const RED = pid("red");
const GREEN = pid("green");
const BLUE = pid("blue");

/** Accusations require standing in a room, so every pawn starts in the kitchen here. */
const game = (chars: CharacterId[]): Game =>
  withState(started(chars), {
    envelope,
    pawns: Object.fromEntries(chars.map((c) => [c, room("kitchen")])),
  });

describe("makeAccusation", () => {
  it("correct accusation before rolling wins", () => {
    const g = unwrap(makeAccusation(game(["red", "green", "blue"]), RED, envelope));
    const p = play(g);
    expect(g.phase).toBe("FINISHED");
    expect(p.winner).toEqual({ playerId: RED, reason: "ACCUSATION" });
    expect(p.events.slice(-2)).toEqual([
      { type: "accused", playerId: RED, accusation: envelope, correct: true },
      { type: "game_won", playerId: RED, reason: "ACCUSATION" },
    ]);
  });

  it("any room may be named, even one the pawn is not in", () => {
    const g = withState(game(["red", "green"]), { pawns: { red: room("kitchen") } });
    expect(play(unwrap(makeAccusation(g, RED, envelope))).winner?.playerId).toBe(RED);
  });

  it("wrong accusation eliminates and passes the turn; pawn stays", () => {
    const before = game(["red", "green", "blue"]);
    const g = unwrap(makeAccusation(before, RED, wrong));
    const p = play(g);
    expect(g.phase).toBe("IN_PROGRESS");
    expect(p.eliminated).toEqual([RED]);
    expect(p.turn.playerId).toBe(GREEN);
    expect(p.pawns.red).toEqual(play(before).pawns.red);
    expect(p.events.slice(-2)).toEqual([
      { type: "accused", playerId: RED, accusation: wrong, correct: false },
      { type: "turn_ended", playerId: RED },
    ]);
    expect(p.winner).toBeNull();
  });

  it("eliminated player is skipped and rejected afterwards", () => {
    let g = unwrap(makeAccusation(game(["red", "green", "blue"]), RED, wrong));
    g = unwrap(endTurn(g, GREEN));
    g = unwrap(endTurn(g, BLUE));
    expect(play(g).turn.playerId).toBe(GREEN);
    expect(codeOf(rollDice(g, RED, diceRng(1, 1)))).toBe("PLAYER_ELIMINATED");
    expect(codeOf(makeAccusation(g, RED, envelope))).toBe("PLAYER_ELIMINATED");
  });

  it("2 players: a wrong accusation makes the other win (LAST_STANDING)", () => {
    const g = unwrap(makeAccusation(game(["red", "green"]), RED, wrong));
    const p = play(g);
    expect(g.phase).toBe("FINISHED");
    expect(p.winner).toEqual({ playerId: GREEN, reason: "LAST_STANDING" });
    expect(p.events.slice(-2)).toEqual([
      { type: "accused", playerId: RED, accusation: wrong, correct: false },
      { type: "game_won", playerId: GREEN, reason: "LAST_STANDING" },
    ]);
  });

  it("elimination chain ends with the last one standing", () => {
    let g = game(["red", "green", "blue", "purple"]);
    g = unwrap(makeAccusation(g, RED, wrong));
    expect(play(g).turn.playerId).toBe(GREEN);
    g = unwrap(endTurn(g, GREEN));
    g = unwrap(makeAccusation(g, BLUE, wrong));
    expect(play(g).turn.playerId).toBe(pid("purple"));
    g = unwrap(makeAccusation(g, pid("purple"), wrong));
    expect(g.phase).toBe("FINISHED");
    expect(play(g).eliminated).toEqual([RED, BLUE, pid("purple")]);
    expect(play(g).winner).toEqual({ playerId: GREEN, reason: "LAST_STANDING" });
  });

  it("allowed after moving and after a resolved suggestion", () => {
    let g = withState(started(["red", "green"]), {
      envelope,
      hands: { [RED]: [], [GREEN]: ["rope"] },
    });
    g = unwrap(rollDice(g, RED, diceRng(6, 6)));
    g = unwrap(movePawn(g, RED, room("lounge")));
    expect(codeOf(makeAccusation(g, RED, wrong))).not.toBe("DISPROVE_PENDING");
    g = unwrap(makeSuggestion(g, RED, "purple", "rope"));
    expect(codeOf(makeAccusation(g, RED, envelope))).toBe("DISPROVE_PENDING");
    g = unwrap(disprove(g, GREEN, "rope"));
    expect(play(unwrap(makeAccusation(g, RED, envelope))).winner?.reason).toBe("ACCUSATION");
  });

  it("only on your own turn", () => {
    expect(codeOf(makeAccusation(game(["red", "green"]), GREEN, envelope))).toBe("NOT_YOUR_TURN");
  });

  it("after FINISHED every command is rejected", () => {
    const g = withState(unwrap(makeAccusation(game(["red", "green"]), RED, envelope)), {
      pawns: { red: room("kitchen") },
    });
    const c = "GAME_NOT_IN_PROGRESS";
    expect(codeOf(rollDice(g, RED, diceRng(1, 1)))).toBe(c);
    expect(codeOf(movePawn(g, RED, room("hall")))).toBe(c);
    expect(codeOf(useSecretPassage(g, RED))).toBe(c);
    expect(codeOf(makeSuggestion(g, RED, "red", "rope"))).toBe(c);
    expect(codeOf(disprove(g, GREEN, "rope"))).toBe(c);
    expect(codeOf(makeAccusation(g, RED, envelope))).toBe(c);
    expect(codeOf(endTurn(g, RED))).toBe(c);
    expect(codeOf(endTurn(g, GREEN))).toBe(c);
    expect(reachableFor(g, RED)).toEqual([]);
    expect(availableActions(g, RED)).toEqual([]);
  });
});

const withSettings = (g: Game, s: Partial<RoomSettings>): Game => ({
  ...g,
  settings: { ...g.settings, ...s },
});
/** Red on its corridor start cell. */
const onCorridor = (): Game => withState(started(["red", "green"]), { envelope });
const inLounge = (): Game => withState(game(["red", "green"]), { pawns: { red: room("lounge") } });
const ctxOf = (g: Game) => {
  const r = requireActivePlayer(g, RED);
  if (!r.ok) throw new Error(r.code);
  return r.value;
};

describe("accusation place and timing (house rules)", () => {
  it("accusing from a corridor fails NOT_IN_ROOM", () => {
    expect(play(onCorridor()).pawns.red.kind).toBe("cell");
    expect(codeOf(makeAccusation(onCorridor(), RED, envelope))).toBe("NOT_IN_ROOM");
  });

  it("accusing from a corridor after moving there fails NOT_IN_ROOM", () => {
    let g = unwrap(rollDice(onCorridor(), RED, diceRng(1, 1)));
    g = unwrap(movePawn(g, RED, cell(23, 7)));
    expect(codeOf(makeAccusation(g, RED, envelope))).toBe("NOT_IN_ROOM");
  });

  it("any_room: accusing from any room naming another room is allowed", () => {
    expect(play(unwrap(makeAccusation(inLounge(), RED, envelope))).winner?.playerId).toBe(RED);
  });

  it("named_room: naming another room fails WRONG_ROOM", () => {
    const g = withSettings(inLounge(), { accusationPlace: "named_room" });
    expect(codeOf(makeAccusation(g, RED, envelope))).toBe("WRONG_ROOM");
  });

  it("named_room: naming current room is allowed", () => {
    const accusation = { ...envelope, room: "lounge" } as const;
    const g = withSettings(withState(inLounge(), { envelope: accusation }), {
      accusationPlace: "named_room",
    });
    expect(play(unwrap(makeAccusation(g, RED, accusation))).winner?.playerId).toBe(RED);
  });

  it("accuse after suggestion allowed by default", () => {
    const g = withState(inLounge(), { turn: { hasSuggested: true } });
    expect(play(unwrap(makeAccusation(g, RED, envelope))).winner?.playerId).toBe(RED);
  });

  it("disabled option: after suggestion fails ACCUSE_AFTER_SUGGESTION_DISABLED, before suggestion allowed", () => {
    const off = withSettings(inLounge(), { accuseAfterSuggestion: false });
    const suggested = withState(off, { turn: { hasSuggested: true } });
    expect(codeOf(makeAccusation(suggested, RED, envelope))).toBe("ACCUSE_AFTER_SUGGESTION_DISABLED");
    expect(play(unwrap(makeAccusation(off, RED, envelope))).winner?.playerId).toBe(RED);
  });

  it("error order: NOT_IN_ROOM → ACCUSE_AFTER_SUGGESTION_DISABLED → WRONG_ROOM", () => {
    const strict = { accuseAfterSuggestion: false, accusationPlace: "named_room" } as const;
    const corridor = withSettings(withState(onCorridor(), { turn: { hasSuggested: true } }), strict);
    expect(codeOf(makeAccusation(corridor, RED, envelope))).toBe("NOT_IN_ROOM");
    const suggested = withSettings(withState(inLounge(), { turn: { hasSuggested: true } }), strict);
    expect(codeOf(makeAccusation(suggested, RED, envelope))).toBe("ACCUSE_AFTER_SUGGESTION_DISABLED");
  });

  it("accusationError checks the room only when an accusation is given", () => {
    expect(accusationError(ctxOf(onCorridor()))).toBe("NOT_IN_ROOM");
    expect(accusationError(ctxOf(inLounge()))).toBeNull();
    const named = withSettings(inLounge(), { accusationPlace: "named_room" });
    expect(accusationError(ctxOf(named))).toBeNull();
    expect(accusationError(ctxOf(named), envelope)).toBe("WRONG_ROOM");
    expect(accusationError(ctxOf(named), { ...envelope, room: "lounge" })).toBeNull();
  });

  it("availableActions omits accuse on a corridor and after suggestion when disabled", () => {
    expect(availableActions(onCorridor(), RED)).toEqual(["roll", "end_turn"]);
    expect(availableActions(inLounge(), RED)).toContain("accuse");
    const off = withSettings(withState(inLounge(), { turn: { hasSuggested: true } }), {
      accuseAfterSuggestion: false,
    });
    expect(availableActions(off, RED)).not.toContain("accuse");
    expect(availableActions(off, RED)).toContain("end_turn");
    const on = withState(inLounge(), { turn: { hasSuggested: true } });
    expect(availableActions(on, RED)).toContain("accuse");
  });
});
