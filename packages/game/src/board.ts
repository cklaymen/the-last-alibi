import type { BoardPosition, CharacterId, RoomId } from "./types.js";

export type CellType = "wall" | "corridor" | "door" | "room" | "start";

export interface Cell {
  readonly type: CellType;
  readonly roomId?: RoomId;
}

export type Board = readonly (readonly Cell[])[];

export const ROWS = 25;
export const COLS = 24;

/**
 * Secret passage pairs (bidirectional): Kitchen↔Study, Conservatory↔Lounge.
 */
export const SECRET_PASSAGES: Readonly<Partial<Record<RoomId, RoomId>>> = {
  kitchen: "study",
  study: "kitchen",
  conservatory: "lounge",
  lounge: "conservatory",
};

/**
 * Fixed starting cell for each character (corridor/start cells around the board edge).
 *
 * Board layout (25 rows × 24 cols):
 *   Kitchen       rows 1–6,   cols 0–5
 *   Ballroom      rows 1–5,   cols 8–15
 *   Conservatory  rows 1–5,   cols 17–22
 *   Billiard Room rows 8–12,  cols 17–22
 *   Library       rows 14–18, cols 16–22
 *   Study         rows 21–24, cols 17–22
 *   Hall          rows 18–24, cols 9–14
 *   Lounge        rows 19–24, cols 0–5
 *   Dining Room   rows 10–16, cols 0–6
 */
export const CHARACTER_STARTS: Readonly<Record<CharacterId, BoardPosition>> = {
  scarlet: { row: 24, col: 7 },
  mustard: { row: 17, col: 0 },
  orchid: { row: 0, col: 17 },
  peacock: { row: 7, col: 23 },
  plum: { row: 19, col: 23 },
  green: { row: 0, col: 9 },
};

function getAdjacent(row: number, col: number): BoardPosition[] {
  const out: BoardPosition[] = [];
  if (row > 0) out.push({ row: row - 1, col });
  if (row < ROWS - 1) out.push({ row: row + 1, col });
  if (col > 0) out.push({ row, col: col - 1 });
  if (col < COLS - 1) out.push({ row, col: col + 1 });
  return out;
}

function buildBoard(): Board {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (): Cell => ({ type: "corridor" })),
  );

  const fillRoom = (
    r1: number,
    r2: number,
    c1: number,
    c2: number,
    id: RoomId,
  ): void => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++) grid[r]![c] = { type: "room", roomId: id };
  };

  fillRoom(1, 6, 0, 5, "kitchen");
  fillRoom(1, 5, 8, 15, "ballroom");
  fillRoom(1, 5, 17, 22, "conservatory");
  fillRoom(8, 12, 17, 22, "billiard_room");
  fillRoom(14, 18, 16, 22, "library");
  fillRoom(21, 24, 17, 22, "study");
  fillRoom(18, 24, 9, 14, "hall");
  fillRoom(19, 24, 0, 5, "lounge");
  fillRoom(10, 16, 0, 6, "dining_room");

  const setDoor = (r: number, c: number, id: RoomId): void => {
    grid[r]![c] = { type: "door", roomId: id };
  };

  // Kitchen
  setDoor(6, 4, "kitchen"); // → (7,4)
  setDoor(3, 5, "kitchen"); // → (3,6)
  // Ballroom
  setDoor(5, 9, "ballroom"); // → (6,9)
  setDoor(5, 13, "ballroom"); // → (6,13)
  setDoor(1, 8, "ballroom"); // → (1,7)
  // Conservatory
  setDoor(3, 22, "conservatory"); // → (3,23)
  setDoor(5, 17, "conservatory"); // → (6,17)
  // Billiard Room
  setDoor(9, 22, "billiard_room"); // → (9,23)
  setDoor(12, 19, "billiard_room"); // → (13,19)
  // Library
  setDoor(14, 16, "library"); // → (14,15)
  setDoor(16, 22, "library"); // → (16,23)
  // Study
  setDoor(21, 17, "study"); // → (20,17)
  setDoor(22, 22, "study"); // → (22,23)
  // Hall
  setDoor(18, 11, "hall"); // → (17,11)
  setDoor(18, 13, "hall"); // → (17,13)
  // Lounge
  setDoor(19, 3, "lounge"); // → (18,3)
  setDoor(21, 5, "lounge"); // → (21,6)
  // Dining Room
  setDoor(10, 3, "dining_room"); // → (9,3)
  setDoor(13, 6, "dining_room"); // → (13,7)
  setDoor(16, 3, "dining_room"); // → (17,3)

  // Character starting cells
  grid[24]![7] = { type: "start" }; // scarlet
  grid[17]![0] = { type: "start" }; // mustard
  grid[0]![17] = { type: "start" }; // orchid
  grid[7]![23] = { type: "start" }; // peacock
  grid[19]![23] = { type: "start" }; // plum
  grid[0]![9] = { type: "start" }; // green

  return grid.map((row) => [...row] as readonly Cell[]) as Board;
}

export const BOARD: Board = buildBoard();

/** Door cells for each room, computed once from BOARD. */
export const ROOM_DOORS: Readonly<Record<RoomId, readonly BoardPosition[]>> =
  (() => {
    const map: Partial<Record<RoomId, BoardPosition[]>> = {};
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = BOARD[r]![c]!;
        if (cell.type === "door" && cell.roomId !== undefined) {
          const id = cell.roomId;
          (map[id] ??= []).push({ row: r, col: c });
        }
      }
    }
    return map as Record<RoomId, readonly BoardPosition[]>;
  })();

/** Returns the RoomId if `position` is inside a room or door cell, else null. */
export function roomAt(position: BoardPosition, board: Board): RoomId | null {
  const { row, col } = position;
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  const cell = board[row]![col]!;
  return cell.type === "room" || cell.type === "door"
    ? (cell.roomId ?? null)
    : null;
}

/**
 * Returns all valid destination cells reachable from `from` within `steps` moves.
 * - Walls and non-door room cells block passage.
 * - Entering a door cell (= entering a room) ends movement.
 * - Occupied corridor/start cells block passage but rooms allow multiple occupants.
 * - When starting inside a room, exits from any door of that room (cost 1 step each).
 */
export function reachableCells(
  from: BoardPosition,
  steps: number,
  board: Board,
  occupiedCells: readonly BoardPosition[],
): BoardPosition[] {
  if (steps <= 0) return [];
  if (from.row < 0 || from.row >= ROWS || from.col < 0 || from.col >= COLS)
    return [];

  const key = (r: number, c: number): string => `${r},${c}`;

  const occupiedCorridors = new Set<string>(
    occupiedCells
      .filter(({ row, col }) => {
        const t = board[row]?.[col]?.type;
        return t === "corridor" || t === "start";
      })
      .map(({ row, col }) => key(row, col)),
  );

  const reachable: BoardPosition[] = [];
  const visited = new Set<string>();
  const queue: Array<{ row: number; col: number; stepsLeft: number }> = [];

  const fromCell = board[from.row]![from.col]!;

  if (fromCell.type === "room" || fromCell.type === "door") {
    const roomId = fromCell.roomId!;
    // Mark all cells of starting room as visited so player cannot re-enter
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r]![c]!.roomId === roomId) visited.add(key(r, c));
      }
    }
    // Exit through each door of the starting room
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r]![c]!;
        if (cell.type === "door" && cell.roomId === roomId) {
          for (const nb of getAdjacent(r, c)) {
            const nCell = board[nb.row]![nb.col]!;
            const nKey = key(nb.row, nb.col);
            if (
              (nCell.type === "corridor" || nCell.type === "start") &&
              !visited.has(nKey) &&
              !occupiedCorridors.has(nKey)
            ) {
              visited.add(nKey);
              reachable.push(nb);
              if (steps > 1) queue.push({ ...nb, stepsLeft: steps - 1 });
            }
          }
        }
      }
    }
  } else if (fromCell.type === "corridor" || fromCell.type === "start") {
    visited.add(key(from.row, from.col));
    queue.push({ row: from.row, col: from.col, stepsLeft: steps });
  }

  while (queue.length > 0) {
    const { row, col, stepsLeft } = queue.shift()!;
    for (const nb of getAdjacent(row, col)) {
      const nKey = key(nb.row, nb.col);
      if (visited.has(nKey)) continue;
      const nCell = board[nb.row]![nb.col]!;
      if (nCell.type === "wall" || nCell.type === "room") continue;
      if (nCell.type === "door") {
        visited.add(nKey);
        reachable.push(nb);
        continue; // entering a room stops movement
      }
      // corridor or start
      if (occupiedCorridors.has(nKey)) continue;
      visited.add(nKey);
      reachable.push(nb);
      if (stepsLeft - 1 > 0) queue.push({ ...nb, stepsLeft: stepsLeft - 1 });
    }
  }

  return reachable;
}
