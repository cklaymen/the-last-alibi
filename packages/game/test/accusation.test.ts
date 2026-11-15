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
} from "../src/index.js";
import { codeOf, diceRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

const envelope = { suspect: "yellow", weapon: "wrench", room: "study" } as const;
const wrong = { suspect: "purple", weapon: "rope", room: "hall" } as const;
const RED = pid("red");
const GREEN = pid("green");
const BLUE = pid("blue");

const game = (chars: CharacterId[]): Game => withState(started(chars), { envelope });

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
    let g = withState(game(["red", "green"]), { hands: { [RED]: [], [GREEN]: ["rope"] } });
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
