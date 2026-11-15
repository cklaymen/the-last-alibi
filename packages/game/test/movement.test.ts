import { describe, expect, it } from "vitest";
import {
  CELLS,
  endTurn,
  movePawn,
  playerId,
  reachableFor,
  rollDice,
  useSecretPassage,
  type Game,
  type Location,
} from "../src/index.js";
import { reachableLocations } from "../src/movement/index.js";
import { cell, codeOf, diceRng, pid, play, room, started, unwrap, withState } from "./helpers.js";

const RED = pid("red");
const BLUE = pid("blue");
const base = () => started(["red", "blue", "green"]);
const rolled = (g: Game, a: number, b: number) => unwrap(rollDice(g, RED, diceRng(a, b)));
const cellsOf = (locs: Location[]) =>
  locs.flatMap((l) => (l.kind === "cell" ? [`${l.position.row},${l.position.col}`] : []));
const roomsOf = (locs: Location[]) => locs.flatMap((l) => (l.kind === "room" ? [l.roomId] : []));

describe("rollDice", () => {
  it("rolls two dice and records an event", () => {
    const g = unwrap(rollDice(base(), RED, diceRng(3, 5)));
    expect(play(g).turn.dice).toEqual([3, 5]);
    expect(play(g).events.at(-1)).toEqual({ type: "rolled", playerId: RED, dice: [3, 5] });
  });

  it("die faces stay in 1..6 for extreme rng values", () => {
    expect(play(unwrap(rollDice(base(), RED, () => 0))).turn.dice).toEqual([1, 1]);
    expect(play(unwrap(rollDice(base(), RED, () => 0.99999))).turn.dice).toEqual([6, 6]);
  });

  it("guards: not your turn, not found, already rolled, already moved", () => {
    expect(codeOf(rollDice(base(), BLUE, diceRng(1, 1)))).toBe("NOT_YOUR_TURN");
    expect(codeOf(rollDice(base(), playerId("ghost"), diceRng(1, 1)))).toBe("PLAYER_NOT_FOUND");
    expect(codeOf(rollDice(rolled(base(), 1, 1), RED, diceRng(1, 1)))).toBe("ALREADY_ROLLED");
    const moved = withState(base(), { turn: { hasMoved: true } });
    expect(codeOf(rollDice(moved, RED, diceRng(1, 1)))).toBe("ALREADY_MOVED");
    const lobbyish = { ...base(), phase: "LOBBY" as const };
    expect(codeOf(rollDice(lobbyish, RED, diceRng(1, 1)))).toBe("GAME_NOT_IN_PROGRESS");
    const elim = withState(base(), { eliminated: [RED] });
    expect(codeOf(rollDice(elim, RED, diceRng(1, 1)))).toBe("PLAYER_ELIMINATED");
  });
});

describe("reachableFor", () => {
  it("is empty before rolling and for other players", () => {
    expect(reachableFor(base(), RED)).toEqual([]);
    expect(reachableFor(rolled(base(), 2, 2), BLUE)).toEqual([]);
  });

  it("moves up to N squares over corridor (open strip)", () => {
    const g = rolled(withState(base(), { pawns: { red: cell(7, 12) } }), 1, 1);
    const expected: string[] = [];
    CELLS.forEach((row, r) =>
      row.forEach((c, col) => {
        const d = Math.abs(r - 7) + Math.abs(col - 12);
        if (c.kind === "corridor" && d >= 1 && d <= 2) expected.push(`${r},${col}`);
      }),
    );
    expect(cellsOf(reachableFor(g, RED))).toEqual(expected);
    expect(roomsOf(reachableFor(g, RED))).toEqual([]);
  });

  it("entering a room costs one step from the door's outside cell", () => {
    const at = withState(base(), { pawns: { red: cell(7, 12) } });
    // ballroom door outside (7,14) is 2 away → needs 3
    expect(roomsOf(reachableFor(rolled(at, 1, 1), RED))).toEqual([]);
    expect(roomsOf(reachableFor(rolled(at, 1, 2), RED))).toEqual(["ballroom"]);
  });

  it("standing on a door's outside cell, 1 step enters the room", () => {
    const locs = reachableLocations(play(base()).pawns, "red", 1, null);
    expect(roomsOf(locs)).toEqual([]);
    const onDoor = { ...play(base()).pawns, red: cell(6, 4) };
    expect(roomsOf(reachableLocations(onDoor, "red", 1, null))).toEqual(["kitchen"]);
  });

  it("cannot pass through or stop on occupied corridor cells", () => {
    const g = rolled(withState(base(), { pawns: { red: cell(7, 12), blue: cell(7, 13) } }), 1, 1);
    const cells = cellsOf(reachableFor(g, RED));
    expect(cells).not.toContain("7,13");
    expect(cells).toContain("8,13");
    expect(cells).not.toContain("7,14");
  });

  it("blocked door: pawn on the outside cell blocks entry through it", () => {
    const free = rolled(withState(base(), { pawns: { red: cell(6, 3) } }), 1, 1);
    expect(roomsOf(reachableFor(free, RED))).toEqual(["kitchen"]);
    const blocked = rolled(withState(base(), { pawns: { red: cell(6, 3), blue: cell(6, 4) } }), 1, 1);
    expect(roomsOf(reachableFor(blocked, RED))).toEqual([]);
  });

  it("a pawn inside a room does not block the corridor", () => {
    const g = rolled(withState(base(), { pawns: { red: cell(6, 3), blue: room("kitchen") } }), 1, 1);
    expect(roomsOf(reachableFor(g, RED))).toEqual(["kitchen"]);
  });

  it("exits a room through its doors; never lists the current room", () => {
    const g = rolled(withState(base(), { pawns: { red: room("conservatory") } }), 1, 1);
    const locs = reachableFor(g, RED);
    expect(cellsOf(locs)).toContain("5,19");
    expect(cellsOf(locs)).toEqual(expect.arrayContaining(["5,18", "5,20", "6,19"]));
    expect(cellsOf(locs)).not.toContain("7,19");
    expect(roomsOf(locs)).toEqual([]);
    const big = rolled(withState(base(), { pawns: { red: room("conservatory") } }), 6, 6);
    expect(roomsOf(reachableFor(big, RED))).not.toContain("conservatory");
  });

  it("blocked room: all doors occupied → cannot move out", () => {
    const g = rolled(withState(base(), { pawns: { red: room("conservatory"), blue: cell(5, 19) } }), 6, 6);
    expect(reachableFor(g, RED)).toEqual([]);
  });

  it("never includes the room left this turn", () => {
    const pawns = { ...play(base()).pawns, red: cell(6, 3) };
    expect(roomsOf(reachableLocations(pawns, "red", 2, "kitchen"))).toEqual([]);
    const g = rolled(withState(base(), { pawns: { red: cell(6, 3) }, turn: { leftRoom: "kitchen" } }), 1, 1);
    expect(roomsOf(reachableFor(g, RED))).toEqual([]);
  });

  it("is empty after moving and while a suggestion is pending", () => {
    const g = rolled(withState(base(), { pawns: { red: cell(7, 12) } }), 1, 1);
    expect(reachableFor(unwrap(movePawn(g, RED, cell(8, 12))), RED)).toEqual([]);
    const pending = withState(g, {
      turn: {
        pendingSuggestion: {
          suggesterId: RED,
          disproverId: BLUE,
          suggestion: { suspect: "red", weapon: "rope", room: "hall" },
        },
      },
    });
    expect(reachableFor(pending, RED)).toEqual([]);
  });

  it("returns a deterministic, duplicate-free list", () => {
    const g = rolled(base(), 6, 6);
    const a = reachableFor(g, RED);
    expect(a).toEqual(reachableFor(g, RED));
    expect(new Set(a.map((l) => JSON.stringify(l))).size).toBe(a.length);
  });
});

describe("movePawn", () => {
  it("guards: NOT_ROLLED, UNREACHABLE, ALREADY_MOVED", () => {
    expect(codeOf(movePawn(base(), RED, cell(23, 7)))).toBe("NOT_ROLLED");
    const g = rolled(base(), 1, 1);
    expect(codeOf(movePawn(g, RED, cell(21, 7)))).toBe("UNREACHABLE");
    expect(codeOf(movePawn(g, RED, room("hall")))).toBe("UNREACHABLE");
    const moved = unwrap(movePawn(g, RED, cell(23, 7)));
    expect(codeOf(movePawn(moved, RED, cell(22, 7)))).toBe("ALREADY_MOVED");
    expect(codeOf(movePawn(g, BLUE, cell(23, 7)))).toBe("NOT_YOUR_TURN");
  });

  it("moves to a corridor cell (fewer than the roll is fine)", () => {
    const g = unwrap(movePawn(rolled(base(), 3, 4), RED, cell(23, 7)));
    const p = play(g);
    expect(p.pawns.red).toEqual(cell(23, 7));
    expect(p.turn.hasMoved).toBe(true);
    expect(p.turn.leftRoom).toBeNull();
    expect(p.turn.suggestionRoom).toBeNull();
    expect(p.events.at(-1)).toEqual({ type: "moved", playerId: RED, to: cell(23, 7) });
  });

  it("entering a room ends the move and enables suggestion there", () => {
    const g = unwrap(movePawn(rolled(base(), 6, 6), RED, room("lounge")));
    const p = play(g);
    expect(p.pawns.red).toEqual(room("lounge"));
    expect(p.turn.suggestionRoom).toBe("lounge");
    expect(p.turn.hasMoved).toBe(true);
    expect(reachableFor(g, RED)).toEqual([]);
    expect(codeOf(rollDice(g, RED, diceRng(1, 1)))).toBe("ALREADY_ROLLED");
  });

  it("leaving a room records leftRoom and loses the summoned room", () => {
    const g = rolled(
      withState(base(), { pawns: { red: room("conservatory") }, turn: { suggestionRoom: "conservatory" } }),
      1,
      1,
    );
    const p = play(unwrap(movePawn(g, RED, cell(5, 19))));
    expect(p.turn.leftRoom).toBe("conservatory");
    expect(p.turn.suggestionRoom).toBeNull();
    expect(p.pawns.red).toEqual(cell(5, 19));
  });

  it("does not mutate the input game", () => {
    const g = rolled(base(), 1, 1);
    const snapshot = JSON.stringify(g);
    unwrap(movePawn(g, RED, cell(23, 7)));
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});

describe("useSecretPassage", () => {
  const inKitchen = () => withState(base(), { pawns: { red: room("kitchen") } });

  it("moves through the passage instead of rolling", () => {
    const g = unwrap(useSecretPassage(inKitchen(), RED));
    const p = play(g);
    expect(p.pawns.red).toEqual(room("study"));
    expect(p.turn).toMatchObject({ hasMoved: true, leftRoom: "kitchen", suggestionRoom: "study", dice: null });
    expect(p.events.at(-1)).toEqual({ type: "passage_used", playerId: RED, from: "kitchen", to: "study" });
    expect(codeOf(rollDice(g, RED, diceRng(1, 1)))).toBe("ALREADY_MOVED");
    expect(codeOf(useSecretPassage(g, RED))).toBe("ALREADY_MOVED");
  });

  it("works for both pairs in both directions", () => {
    for (const [from, to] of [
      ["kitchen", "study"],
      ["study", "kitchen"],
      ["conservatory", "lounge"],
      ["lounge", "conservatory"],
    ] as const) {
      const g = unwrap(useSecretPassage(withState(base(), { pawns: { red: room(from) } }), RED));
      expect(play(g).pawns.red).toEqual(room(to));
    }
  });

  it("is rejected after rolling", () => {
    expect(codeOf(useSecretPassage(rolled(inKitchen(), 1, 1), RED))).toBe("ALREADY_ROLLED");
  });

  it("is rejected outside a passage room", () => {
    expect(codeOf(useSecretPassage(base(), RED))).toBe("NO_SECRET_PASSAGE");
    const ballroom = withState(base(), { pawns: { red: room("ballroom") } });
    expect(codeOf(useSecretPassage(ballroom, RED))).toBe("NO_SECRET_PASSAGE");
  });

  it("is rejected for other players", () => {
    expect(codeOf(useSecretPassage(inKitchen(), BLUE))).toBe("NOT_YOUR_TURN");
  });
});

describe("endTurn", () => {
  it("can end the turn without rolling or moving", () => {
    const g = unwrap(endTurn(base(), RED));
    const p = play(g);
    expect(p.turn.playerId).toBe(pid("green"));
    expect(p.turn.dice).toBeNull();
    expect(p.events.at(-1)).toEqual({ type: "turn_ended", playerId: RED });
  });

  it("can end the turn after rolling without moving; wraps around", () => {
    let g = unwrap(endTurn(rolled(base(), 2, 3), RED));
    g = unwrap(endTurn(g, pid("green")));
    expect(play(g).turn.playerId).toBe(BLUE);
    g = unwrap(endTurn(g, BLUE));
    expect(play(g).turn.playerId).toBe(RED);
  });

  it("skips eliminated players", () => {
    const g = unwrap(endTurn(withState(base(), { eliminated: [pid("green")] }), RED));
    expect(play(g).turn.playerId).toBe(BLUE);
  });

  it("guards", () => {
    expect(codeOf(endTurn(base(), BLUE))).toBe("NOT_YOUR_TURN");
    const pending = withState(base(), {
      turn: {
        pendingSuggestion: {
          suggesterId: RED,
          disproverId: BLUE,
          suggestion: { suspect: "red", weapon: "rope", room: "hall" },
        },
      },
    });
    expect(codeOf(endTurn(pending, RED))).toBe("DISPROVE_PENDING");
  });
});
