import { describe, expect, it } from "vitest";
import {
  BOARD,
  COLS,
  ROOM_DOORS,
  ROWS,
  reachableCells,
  roomAt,
} from "../src/board.js";

// ── roomAt ─────────────────────────────────────────────────────────────────

describe("roomAt", () => {
  it("returns null for a corridor cell", () => {
    // Row 7 is entirely corridor
    expect(roomAt({ row: 7, col: 7 }, BOARD)).toBeNull();
  });

  it("returns the room for an interior room cell", () => {
    // Kitchen interior: rows 1-6, cols 0-5
    expect(roomAt({ row: 3, col: 2 }, BOARD)).toBe("kitchen");
  });

  it("returns the room for a door cell", () => {
    // Kitchen door at (6,4)
    expect(roomAt({ row: 6, col: 4 }, BOARD)).toBe("kitchen");
  });

  it("returns null for start cells", () => {
    // Scarlet start at (24,7)
    expect(roomAt({ row: 24, col: 7 }, BOARD)).toBeNull();
  });

  it("returns null for out-of-bounds positions", () => {
    expect(roomAt({ row: -1, col: 0 }, BOARD)).toBeNull();
    expect(roomAt({ row: ROWS, col: 0 }, BOARD)).toBeNull();
    expect(roomAt({ row: 0, col: COLS }, BOARD)).toBeNull();
  });
});

// ── reachableCells – corridor movement ────────────────────────────────────

describe("reachableCells – corridor", () => {
  it("returns empty when steps is 0", () => {
    expect(reachableCells({ row: 7, col: 7 }, 0, BOARD, [])).toEqual([]);
  });

  it("returns only orthogonal corridor neighbours for 1 step", () => {
    // (7,7): left=(7,6), right=(7,8), up=(6,7), down=(8,7) — all corridor
    const result = reachableCells({ row: 7, col: 7 }, 1, BOARD, []);
    const keys = result.map((p) => `${p.row},${p.col}`).sort();
    expect(keys).toEqual(["6,7", "7,6", "7,8", "8,7"]);
  });

  it("cannot reach cells beyond the step budget", () => {
    const result = reachableCells({ row: 7, col: 7 }, 1, BOARD, []);
    // (7,5) is 2 steps away
    expect(result).not.toContainEqual({ row: 7, col: 5 });
  });

  it("includes all cells within budget", () => {
    const result = reachableCells({ row: 7, col: 7 }, 2, BOARD, []);
    expect(result).toContainEqual({ row: 7, col: 5 });
    expect(result).toContainEqual({ row: 5, col: 7 });
  });

  it("respects board boundaries (top-left corner)", () => {
    // (0,0): only right=(0,1) and down=(1,0) but (1,0) is Kitchen interior (not door)
    const result = reachableCells({ row: 0, col: 0 }, 1, BOARD, []);
    expect(result).toContainEqual({ row: 0, col: 1 });
    expect(result).not.toContainEqual({ row: 1, col: 0 }); // room cell, no door
  });

  it("blocks occupied corridor cells", () => {
    // Occupy (7,8); from (7,7) step 1 can no longer reach (7,8)
    const result = reachableCells({ row: 7, col: 7 }, 1, BOARD, [
      { row: 7, col: 8 },
    ]);
    expect(result).not.toContainEqual({ row: 7, col: 8 });
  });

  it("does not block movement through rooms (rooms allow multi-occupancy)", () => {
    // Occupying a door cell does not prevent entering; rooms are free
    // Place a character at Kitchen door (6,4); another approaches from (7,4)
    const result = reachableCells(
      { row: 7, col: 4 },
      1,
      BOARD,
      [{ row: 6, col: 4 }], // occupied door cell
    );
    // Door cells are room-type — occupiedCells filter only applies to corridors
    expect(result).toContainEqual({ row: 6, col: 4 });
  });
});

// ── reachableCells – door entry ────────────────────────────────────────────

describe("reachableCells – door entry", () => {
  it("can enter a room by stepping onto a door cell", () => {
    // Kitchen door (6,4) is 1 step from corridor (7,4)
    const result = reachableCells({ row: 7, col: 4 }, 1, BOARD, []);
    expect(result).toContainEqual({ row: 6, col: 4 });
  });

  it("cannot enter a room through a non-door boundary cell", () => {
    // (0,0) is adjacent to (1,0) which is a plain Kitchen room cell
    const result = reachableCells({ row: 0, col: 0 }, 1, BOARD, []);
    expect(result).not.toContainEqual({ row: 1, col: 0 });
  });

  it("entering a room stops further movement (door cell not used as stepping stone)", () => {
    // 3 steps from (7,4): can reach (6,4) in 1 step, but NOT (5,4) via the room
    const result = reachableCells({ row: 7, col: 4 }, 3, BOARD, []);
    const keys = new Set(result.map((p) => `${p.row},${p.col}`));
    expect(keys.has("6,4")).toBe(true); // door reachable
    expect(keys.has("5,4")).toBe(false); // interior room not reachable through door
  });
});

// ── reachableCells – room exit ─────────────────────────────────────────────

describe("reachableCells – exiting a room", () => {
  it("exits to the adjacent corridor of a door cell in 1 step", () => {
    // Start at Kitchen door (6,4); adjacent corridor is (7,4)
    const result = reachableCells({ row: 6, col: 4 }, 1, BOARD, []);
    expect(result).toContainEqual({ row: 7, col: 4 });
  });

  it("uses all door exits of the starting room", () => {
    // Kitchen has 2 doors: (6,4)→(7,4) and (3,5)→(3,6)
    // With 1 step both adjacent corridors should be reachable
    const result = reachableCells({ row: 6, col: 4 }, 1, BOARD, []);
    const keys = new Set(result.map((p) => `${p.row},${p.col}`));
    expect(keys.has("7,4")).toBe(true); // door (6,4) exit
    expect(keys.has("3,6")).toBe(true); // door (3,5) exit
  });

  it("does not re-enter the starting room from exit corridor", () => {
    const result = reachableCells({ row: 6, col: 4 }, 2, BOARD, []);
    const keys = new Set(result.map((p) => `${p.row},${p.col}`));
    // (6,4) is the starting door — should not appear as destination
    expect(keys.has("6,4")).toBe(false);
    // (3,5) is the other kitchen door — also blocked
    expect(keys.has("3,5")).toBe(false);
  });

  it("continues moving through corridors after exiting", () => {
    // 2 steps from kitchen door (6,4): exit to (7,4) then continue
    const result = reachableCells({ row: 6, col: 4 }, 2, BOARD, []);
    const keys = new Set(result.map((p) => `${p.row},${p.col}`));
    expect(keys.has("7,4")).toBe(true);
    expect(keys.has("8,4")).toBe(true); // 1 step beyond (7,4)
  });

  it("also exits kitchen through second door (3,5) in multi-step move", () => {
    const result = reachableCells({ row: 3, col: 5 }, 2, BOARD, []);
    const keys = new Set(result.map((p) => `${p.row},${p.col}`));
    // (3,6) is 1 step away; (3,7) is 2 steps away
    expect(keys.has("3,6")).toBe(true);
    expect(keys.has("3,7")).toBe(true);
  });
});

// ── ROOM_DOORS ─────────────────────────────────────────────────────────────

describe("ROOM_DOORS", () => {
  it("every room has at least one door", () => {
    const ids: string[] = [
      "kitchen",
      "ballroom",
      "conservatory",
      "billiard_room",
      "library",
      "study",
      "hall",
      "lounge",
      "dining_room",
    ];
    for (const id of ids) {
      const doors = ROOM_DOORS[id as keyof typeof ROOM_DOORS];
      expect(doors.length, `${id} should have ≥1 door`).toBeGreaterThan(0);
    }
  });

  it("each door cell is adjacent to at least one corridor/start cell", () => {
    for (const doors of Object.values(ROOM_DOORS)) {
      for (const { row, col } of doors) {
        const neighbours = [
          { row: row - 1, col },
          { row: row + 1, col },
          { row, col: col - 1 },
          { row, col: col + 1 },
        ].filter(
          ({ row: r, col: c }) => r >= 0 && r < ROWS && c >= 0 && c < COLS,
        );
        const hasCorridorNeighbour = neighbours.some(({ row: r, col: c }) => {
          const t = BOARD[r]?.[c]?.type;
          return t === "corridor" || t === "start";
        });
        expect(
          hasCorridorNeighbour,
          `door at (${row},${col}) must face a corridor`,
        ).toBe(true);
      }
    }
  });
});
