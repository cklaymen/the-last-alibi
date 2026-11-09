import { describe, expect, it } from "vitest";
import { createGame, joinGame } from "../src/game.js";
import {
  disproveOrPass,
  endTurn,
  makeAccusation,
  makeSuggestion,
  moveCharacter,
  rollDice,
  startGame,
  useSecretPassage,
} from "../src/turn.js";
import { CHARACTER_STARTS, ROOM_DOORS, roomAt } from "../src/board.js";
import { BOARD } from "../src/board.js";
import type { InProgressGame, PlayerId, Rng } from "../src/types.js";
import type { Game, Player } from "../src/types.js";

// ── helpers ────────────────────────────────────────────────────────────────

function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length]!;
}

/** Always returns the first item from any array pick. */
const firstRng: Rng = () => 0;

const p1 = "p1" as PlayerId;
const p2 = "p2" as PlayerId;
const p3 = "p3" as PlayerId;

function mkPlayer(id: PlayerId, name: string): Player {
  return { id, name, isReady: true };
}

function twoPlayerGame(): InProgressGame {
  const host: Player = { ...mkPlayer(p1, "Alice"), characterId: "scarlet" };
  let game: Game = createGame("g1" as never, "000001" as never, host);
  const joined = joinGame(game, {
    ...mkPlayer(p2, "Bob"),
    characterId: "mustard",
  });
  game = joined.ok ? joined.game : game;
  return startGame(game, [p1, p2], firstRng);
}

function threePlayerGame(): InProgressGame {
  const host: Player = { ...mkPlayer(p1, "Alice"), characterId: "scarlet" };
  let game: Game = createGame("g1" as never, "000001" as never, host);
  const j2 = joinGame(game, { ...mkPlayer(p2, "Bob"), characterId: "mustard" });
  game = j2.ok ? j2.game : game;
  const j3 = joinGame(game, { ...mkPlayer(p3, "Eve"), characterId: "orchid" });
  game = j3.ok ? j3.game : game;
  return startGame(game, [p1, p2, p3], firstRng);
}

// Place p1's character inside a room for action-phase tests
function gameWithP1InRoom(
  base: InProgressGame,
  roomId: "kitchen" | "hall" | "study" | "lounge",
): InProgressGame {
  const doors = ROOM_DOORS[roomId];
  const doorPos = doors[0]!;
  const p1Token = base.characterTokens.find(
    (t) => t.characterId === "scarlet",
  )!;
  return {
    ...base,
    turn: { playerId: p1, phase: "ACTION" },
    characterTokens: base.characterTokens.map((t) =>
      t.characterId === p1Token.characterId ? { ...t, position: doorPos } : t,
    ),
  };
}

// ── startGame ──────────────────────────────────────────────────────────────

describe("startGame", () => {
  it("sets phase to IN_PROGRESS", () => {
    expect(twoPlayerGame().phase).toBe("IN_PROGRESS");
  });

  it("first turn belongs to first player in order", () => {
    expect(twoPlayerGame().turn.playerId).toBe(p1);
  });

  it("first turn phase is ROLL", () => {
    expect(twoPlayerGame().turn.phase).toBe("ROLL");
  });

  it("places each character at their starting cell", () => {
    const g = twoPlayerGame();
    for (const token of g.characterTokens) {
      const expected = CHARACTER_STARTS[token.characterId]!;
      expect(token.position).toEqual(expected);
    }
  });

  it("deals cards without duplicates", () => {
    const g = twoPlayerGame();
    const p1Cards = g.playerHands.get(p1) ?? [];
    const p2Cards = g.playerHands.get(p2) ?? [];
    const all = [...p1Cards, ...p2Cards];
    expect(new Set(all).size).toBe(all.length);
  });

  it("envelope cards do not appear in any hand", () => {
    const g = twoPlayerGame();
    const allCards = [
      ...(g.playerHands.get(p1) ?? []),
      ...(g.playerHands.get(p2) ?? []),
    ];
    expect(allCards).not.toContain(g.envelope.suspect);
    expect(allCards).not.toContain(g.envelope.weapon);
    expect(allCards).not.toContain(g.envelope.room);
  });

  it("places all weapons in rooms", () => {
    const g = twoPlayerGame();
    for (const token of g.weaponTokens) {
      expect(typeof token.roomId).toBe("string");
    }
  });

  it("no players are eliminated at start", () => {
    expect(twoPlayerGame().eliminatedPlayers).toHaveLength(0);
  });
});

// ── rollDice ───────────────────────────────────────────────────────────────

describe("rollDice", () => {
  it("advances phase to MOVE", () => {
    const g = twoPlayerGame();
    const result = rollDice(g, p1, firstRng);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.game.turn.phase).toBe("MOVE");
  });

  it("rejects wrong player", () => {
    const g = twoPlayerGame();
    expect(rollDice(g, p2, firstRng).ok).toBe(false);
  });

  it("rejects wrong phase", () => {
    const g = twoPlayerGame();
    const afterRoll = rollDice(g, p1, firstRng);
    if (!afterRoll.ok) throw new Error("roll failed");
    expect(rollDice(afterRoll.game, p1, firstRng).ok).toBe(false);
  });

  it("dice values are between 1 and 6 each", () => {
    const g = twoPlayerGame();
    const result = rollDice(g, p1, seqRng([0.99, 0.0]));
    if (!result.ok) throw new Error();
    const [d1, d2] = result.game.turn.diceRoll!;
    expect(d1).toBeGreaterThanOrEqual(1);
    expect(d1).toBeLessThanOrEqual(6);
    expect(d2).toBeGreaterThanOrEqual(1);
    expect(d2).toBeLessThanOrEqual(6);
  });

  it("remainingMoves equals d1+d2", () => {
    // seqRng([0.5, 0.5]) → each die = floor(0.5*6)+1 = 4 → total 8
    const g = twoPlayerGame();
    const result = rollDice(g, p1, seqRng([0.5, 0.5]));
    if (!result.ok) throw new Error();
    const [d1, d2] = result.game.turn.diceRoll!;
    expect(result.game.turn.remainingMoves).toBe(d1 + d2);
  });
});

// ── moveCharacter ──────────────────────────────────────────────────────────

describe("moveCharacter", () => {
  function gameInMovePhase(): InProgressGame {
    const g = twoPlayerGame();
    // Force 4 moves to make testing simpler
    return {
      ...g,
      turn: {
        playerId: p1,
        phase: "MOVE",
        diceRoll: [2, 2] as const,
        remainingMoves: 4,
      },
    };
  }

  it("rejects wrong player", () => {
    expect(moveCharacter(gameInMovePhase(), p2, { row: 0, col: 0 }).ok).toBe(
      false,
    );
  });

  it("rejects wrong phase", () => {
    const g = twoPlayerGame(); // ROLL phase
    expect(moveCharacter(g, p1, { row: 0, col: 0 }).ok).toBe(false);
  });

  it("rejects unreachable destination", () => {
    const g = gameInMovePhase();
    // Scarlet starts at (24,7); (0,0) is more than 4 steps away
    expect(moveCharacter(g, p1, { row: 0, col: 0 }).ok).toBe(false);
  });

  it("moves to a reachable corridor cell and phase → DONE", () => {
    const g = gameInMovePhase();
    // Scarlet at (24,7); (24,11) is 4 steps right — but hall starts at col 9.
    // So (23,7) is 1 step up — let's use that
    const result = moveCharacter(g, p1, { row: 23, col: 7 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.turn.phase).toBe("DONE");
      const token = result.game.characterTokens.find(
        (t) => t.characterId === "scarlet",
      )!;
      expect(token.position).toEqual({ row: 23, col: 7 });
    }
  });

  it("entering a room sets phase → ACTION", () => {
    const g = gameInMovePhase();
    // Scarlet at (24,7); Hall door (18,11) requires 10+ steps — not reachable
    // Use kitchen approach: start near kitchen door instead
    // Place Scarlet 1 step from Lounge door (19,3): corridor at (18,3)
    const modified: InProgressGame = {
      ...g,
      turn: {
        playerId: p1,
        phase: "MOVE",
        diceRoll: [1, 0] as const,
        remainingMoves: 1,
      },
      characterTokens: g.characterTokens.map((t) =>
        t.characterId === "scarlet"
          ? { ...t, position: { row: 18, col: 3 } }
          : t,
      ),
    };
    const result = moveCharacter(modified, p1, { row: 19, col: 3 }); // lounge door
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.game.turn.phase).toBe("ACTION");
  });
});

// ── useSecretPassage ───────────────────────────────────────────────────────

describe("useSecretPassage", () => {
  it("teleports from kitchen to study", () => {
    const base = twoPlayerGame();
    // Place p1 at kitchen door
    const g = gameWithP1InRoom(base, "kitchen");
    const result = useSecretPassage(g, p1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const token = result.game.characterTokens.find(
        (t) => t.characterId === "scarlet",
      )!;
      expect(roomAt(token.position, BOARD)).toBe("study");
      expect(result.game.turn.phase).toBe("ACTION");
    }
  });

  it("teleports from lounge to conservatory", () => {
    const base = twoPlayerGame();
    const g = gameWithP1InRoom(base, "lounge");
    const result = useSecretPassage(g, p1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const token = result.game.characterTokens.find(
        (t) => t.characterId === "scarlet",
      )!;
      expect(roomAt(token.position, BOARD)).toBe("conservatory");
    }
  });

  it("rejects when not in a passage room", () => {
    const base = twoPlayerGame();
    const g = gameWithP1InRoom(base, "hall");
    expect(useSecretPassage(g, p1).ok).toBe(false);
  });

  it("rejects outside ACTION phase", () => {
    const g = twoPlayerGame(); // ROLL phase
    expect(useSecretPassage(g, p1).ok).toBe(false);
  });
});

// ── makeSuggestion ─────────────────────────────────────────────────────────

describe("makeSuggestion", () => {
  it("transitions to SUGGEST_PENDING_DISPROVE", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const result = makeSuggestion(g, p1, "mustard", "knife");
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.game.turn.phase).toBe("SUGGEST_PENDING_DISPROVE");
  });

  it("stores the suggestion on the turn", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const result = makeSuggestion(g, p1, "mustard", "knife");
    if (!result.ok) throw new Error();
    expect(result.game.turn.suggestion).toEqual({
      suspect: "mustard",
      weapon: "knife",
      room: "kitchen",
    });
  });

  it("builds disprove queue excluding suggester", () => {
    const g = gameWithP1InRoom(threePlayerGame(), "kitchen");
    const result = makeSuggestion(g, p1, "mustard", "knife");
    if (!result.ok) throw new Error();
    expect(result.game.turn.disproveQueue).toEqual([p2, p3]);
  });

  it("moves suspect character token into the suggestion room", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const result = makeSuggestion(g, p1, "mustard", "knife");
    if (!result.ok) throw new Error();
    const mustardToken = result.game.characterTokens.find(
      (t) => t.characterId === "mustard",
    )!;
    expect(roomAt(mustardToken.position, BOARD)).toBe("kitchen");
  });

  it("moves named weapon to suggestion room", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const result = makeSuggestion(g, p1, "mustard", "knife");
    if (!result.ok) throw new Error();
    const knifeToken = result.game.weaponTokens.find(
      (t) => t.weaponId === "knife",
    )!;
    expect(knifeToken.roomId).toBe("kitchen");
  });

  it("rejects when not in ACTION phase", () => {
    const g = twoPlayerGame(); // ROLL
    expect(makeSuggestion(g, p1, "mustard", "knife").ok).toBe(false);
  });

  it("rejects when not in a room", () => {
    const g = {
      ...twoPlayerGame(),
      turn: { playerId: p1, phase: "ACTION" as const },
    };
    expect(makeSuggestion(g, p1, "mustard", "knife").ok).toBe(false);
  });
});

// ── disproveOrPass ─────────────────────────────────────────────────────────

describe("disproveOrPass", () => {
  function gameWithSuggestion(): InProgressGame {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const r = makeSuggestion(g, p1, "mustard", "knife");
    if (!r.ok) throw new Error("suggestion failed");
    return r.game;
  }

  it("rejects wrong phase", () => {
    expect(disproveOrPass(twoPlayerGame(), p2).ok).toBe(false);
  });

  it("rejects wrong player (not head of queue)", () => {
    const g = gameWithSuggestion();
    // queue is [p2]; p1 (suggester) is not allowed to disprove
    expect(disproveOrPass(g, p1).ok).toBe(false);
  });

  it("passing advances the queue", () => {
    const g3 = gameWithP1InRoom(threePlayerGame(), "kitchen");
    const suggResult = makeSuggestion(g3, p1, "mustard", "knife");
    if (!suggResult.ok) throw new Error();
    // queue is [p2, p3]; p2 passes
    const passResult = disproveOrPass(suggResult.game, p2);
    expect(passResult.ok).toBe(true);
    if (passResult.ok) {
      expect(passResult.game.turn.disproveQueue).toEqual([p3]);
      expect(passResult.game.turn.phase).toBe("SUGGEST_PENDING_DISPROVE");
    }
  });

  it("all players pass → phase DONE, lastDisproval null", () => {
    const g = gameWithSuggestion(); // 2-player: queue=[p2]
    const result = disproveOrPass(g, p2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.turn.phase).toBe("DONE");
      expect(result.game.turn.lastDisproval).toBeNull();
    }
  });

  it("showing a matching card resolves to DONE with lastDisproval set", () => {
    // Give p2 a card that matches the suggestion
    const base = gameWithSuggestion();
    // Override p2's hand to include "mustard"
    const newHands = new Map(base.playerHands);
    newHands.set(p2, ["mustard"]);
    const g = { ...base, playerHands: newHands };

    const result = disproveOrPass(g, p2, "mustard");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.turn.phase).toBe("DONE");
      expect(result.game.turn.lastDisproval?.cardId).toBe("mustard");
    }
  });

  it("rejects card not in hand", () => {
    const base = gameWithSuggestion();
    const newHands = new Map(base.playerHands);
    newHands.set(p2, []); // empty hand
    const g = { ...base, playerHands: newHands };
    expect(disproveOrPass(g, p2, "mustard").ok).toBe(false);
  });

  it("rejects card not in suggestion", () => {
    const base = gameWithSuggestion();
    const newHands = new Map(base.playerHands);
    newHands.set(p2, ["rope"]); // holds rope, not in suggestion
    const g = { ...base, playerHands: newHands };
    expect(disproveOrPass(g, p2, "rope").ok).toBe(false);
  });
});

// ── makeAccusation ─────────────────────────────────────────────────────────

describe("makeAccusation", () => {
  it("correct accusation → phase FINISHED, winner set", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const { envelope } = g;
    const result = makeAccusation(
      g,
      p1,
      envelope.suspect,
      envelope.weapon,
      envelope.room,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.phase).toBe("FINISHED");
      expect(result.game.winner).toBe(p1);
    }
  });

  it("wrong accusation eliminates player", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const { envelope } = g;
    // Use a wrong weapon
    const wrongWeapon = envelope.weapon === "knife" ? "rope" : "knife";
    const result = makeAccusation(
      g,
      p1,
      envelope.suspect,
      wrongWeapon,
      envelope.room,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.eliminatedPlayers).toContain(p1);
    }
  });

  it("wrong accusation with other active players: game continues IN_PROGRESS", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const { envelope } = g;
    const wrongWeapon = envelope.weapon === "knife" ? "rope" : "knife";
    const result = makeAccusation(
      g,
      p1,
      envelope.suspect,
      wrongWeapon,
      envelope.room,
    );
    if (!result.ok) throw new Error();
    expect(result.game.phase).toBe("IN_PROGRESS");
  });

  it("all eliminated → phase FINISHED without winner", () => {
    // Start a game, eliminate p2 first, then p1 makes wrong accusation
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const { envelope } = g;
    const withP2Elim: InProgressGame = { ...g, eliminatedPlayers: [p2] };
    const wrongWeapon = envelope.weapon === "knife" ? "rope" : "knife";
    const result = makeAccusation(
      withP2Elim,
      p1,
      envelope.suspect,
      wrongWeapon,
      envelope.room,
    );
    if (!result.ok) throw new Error();
    expect(result.game.phase).toBe("FINISHED");
    expect(result.game.winner).toBeUndefined();
  });

  it("rejects from wrong phase", () => {
    const g = twoPlayerGame(); // ROLL
    expect(makeAccusation(g, p1, "scarlet", "knife", "kitchen").ok).toBe(false);
  });
});

// ── endTurn ────────────────────────────────────────────────────────────────

describe("endTurn", () => {
  it("advances to next player with ROLL phase", () => {
    const g: InProgressGame = {
      ...twoPlayerGame(),
      turn: { playerId: p1, phase: "DONE" },
    };
    const result = endTurn(g, p1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.game.turn.playerId).toBe(p2);
      expect(result.game.turn.phase).toBe("ROLL");
    }
  });

  it("skips eliminated players", () => {
    const g: InProgressGame = {
      ...threePlayerGame(),
      turn: { playerId: p1, phase: "DONE" },
      eliminatedPlayers: [p2],
    };
    const result = endTurn(g, p1);
    if (!result.ok) throw new Error();
    expect(result.game.turn.playerId).toBe(p3);
  });

  it("rejects from ROLL phase", () => {
    expect(endTurn(twoPlayerGame(), p1).ok).toBe(false);
  });

  it("rejects wrong player", () => {
    const g: InProgressGame = {
      ...twoPlayerGame(),
      turn: { playerId: p1, phase: "DONE" },
    };
    expect(endTurn(g, p2).ok).toBe(false);
  });

  it("rejects when game is FINISHED", () => {
    const g: InProgressGame = {
      ...twoPlayerGame(),
      phase: "FINISHED",
      turn: { playerId: p1, phase: "DONE" },
    };
    expect(endTurn(g, p1).ok).toBe(false);
  });

  it("allows endTurn directly from ACTION phase", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const result = endTurn(g, p1);
    expect(result.ok).toBe(true);
  });
});

// ── full turn lifecycle ────────────────────────────────────────────────────

describe("full turn lifecycle", () => {
  it("ROLL → MOVE → corridor → DONE → endTurn → next player ROLL", () => {
    let g = twoPlayerGame();

    // p1 rolls
    const rolled = rollDice(g, p1, seqRng([0.1, 0.1])); // 1+1=2 moves
    if (!rolled.ok) throw new Error("roll failed");
    g = rolled.game;
    expect(g.turn.phase).toBe("MOVE");

    // p1 moves to adjacent corridor
    const scarletStart = CHARACTER_STARTS["scarlet"]!; // (24,7)
    const dest = { row: scarletStart.row - 1, col: scarletStart.col }; // (23,7)
    const moved = moveCharacter(g, p1, dest);
    if (!moved.ok) throw new Error("move failed");
    g = moved.game;
    expect(g.turn.phase).toBe("DONE");

    // p1 ends turn
    const ended = endTurn(g, p1);
    if (!ended.ok) throw new Error("endTurn failed");
    g = ended.game;
    expect(g.turn.playerId).toBe(p2);
    expect(g.turn.phase).toBe("ROLL");
  });
});

// ── suggestion with nobody holding matching cards ──────────────────────────

describe("suggestion with no one holding matching cards", () => {
  it("resolves to DONE with lastDisproval null after all pass", () => {
    const g3 = gameWithP1InRoom(threePlayerGame(), "kitchen");
    // Clear hands so neither p2 nor p3 can disprove
    const emptyHands = new Map(g3.playerHands);
    emptyHands.set(p2, []);
    emptyHands.set(p3, []);
    const g = { ...g3, playerHands: emptyHands };

    const s = makeSuggestion(g, p1, "mustard", "knife");
    if (!s.ok) throw new Error();
    let g2 = s.game;

    const pass1 = disproveOrPass(g2, p2);
    if (!pass1.ok) throw new Error();
    g2 = pass1.game;
    expect(g2.turn.phase).toBe("SUGGEST_PENDING_DISPROVE");

    const pass2 = disproveOrPass(g2, p3);
    if (!pass2.ok) throw new Error();
    g2 = pass2.game;
    expect(g2.turn.phase).toBe("DONE");
    expect(g2.turn.lastDisproval).toBeNull();
  });
});

// ── elimination chain ──────────────────────────────────────────────────────

describe("elimination chain", () => {
  it("last wrong accusation (all eliminated) finishes game without winner", () => {
    const g = gameWithP1InRoom(twoPlayerGame(), "kitchen");
    const { envelope } = g;
    const wrongWeapon = envelope.weapon === "knife" ? "rope" : "knife";

    // p2 already eliminated
    const g2: InProgressGame = { ...g, eliminatedPlayers: [p2] };
    const result = makeAccusation(
      g2,
      p1,
      envelope.suspect,
      wrongWeapon,
      envelope.room,
    );
    if (!result.ok) throw new Error();
    expect(result.game.phase).toBe("FINISHED");
    expect(result.game.winner).toBeUndefined();
  });
});
