import type { CharacterId, Position, RoomId } from "../shared/types.js";

/**
 * Original 24×25 board. Static data only – safe for the web client to import
 * for rendering. Rooms are axis-aligned rectangles (inclusive bounds).
 */
export const ROWS = 25;
export const COLS = 24;

export interface Rect {
  readonly top: number;
  readonly left: number;
  readonly bottom: number;
  readonly right: number;
}

export const ROOM_RECTS: Readonly<Record<RoomId, Rect>> = {
  kitchen: { top: 0, left: 0, bottom: 5, right: 5 },
  ballroom: { top: 0, left: 8, bottom: 6, right: 15 },
  conservatory: { top: 0, left: 18, bottom: 4, right: 23 },
  dining_room: { top: 9, left: 0, bottom: 15, right: 6 },
  billiard_room: { top: 8, left: 18, bottom: 12, right: 23 },
  library: { top: 14, left: 17, bottom: 18, right: 23 },
  lounge: { top: 19, left: 0, bottom: 24, right: 6 },
  hall: { top: 18, left: 9, bottom: 24, right: 14 },
  study: { top: 21, left: 17, bottom: 24, right: 23 },
};

/** Inaccessible centre of the board. */
export const CENTER_RECT: Rect = { top: 9, left: 9, bottom: 15, right: 14 };

/**
 * A doorway: `inside` is the room cell on the room's edge, `outside` the
 * corridor cell in front of it. A room is entered/exited only via `outside`.
 */
export interface Door {
  readonly roomId: RoomId;
  readonly inside: Position;
  readonly outside: Position;
}

export const DOORS: readonly Door[] = [
  { roomId: "kitchen", inside: { row: 5, col: 4 }, outside: { row: 6, col: 4 } },
  { roomId: "kitchen", inside: { row: 3, col: 5 }, outside: { row: 3, col: 6 } },
  { roomId: "ballroom", inside: { row: 2, col: 8 }, outside: { row: 2, col: 7 } },
  { roomId: "ballroom", inside: { row: 2, col: 15 }, outside: { row: 2, col: 16 } },
  { roomId: "ballroom", inside: { row: 6, col: 9 }, outside: { row: 7, col: 9 } },
  { roomId: "ballroom", inside: { row: 6, col: 14 }, outside: { row: 7, col: 14 } },
  { roomId: "conservatory", inside: { row: 4, col: 19 }, outside: { row: 5, col: 19 } },
  { roomId: "dining_room", inside: { row: 9, col: 4 }, outside: { row: 8, col: 4 } },
  { roomId: "dining_room", inside: { row: 12, col: 6 }, outside: { row: 12, col: 7 } },
  { roomId: "dining_room", inside: { row: 15, col: 5 }, outside: { row: 16, col: 5 } },
  { roomId: "billiard_room", inside: { row: 8, col: 20 }, outside: { row: 7, col: 20 } },
  { roomId: "billiard_room", inside: { row: 11, col: 18 }, outside: { row: 11, col: 17 } },
  { roomId: "library", inside: { row: 14, col: 20 }, outside: { row: 13, col: 20 } },
  { roomId: "library", inside: { row: 16, col: 17 }, outside: { row: 16, col: 16 } },
  { roomId: "lounge", inside: { row: 19, col: 6 }, outside: { row: 18, col: 6 } },
  { roomId: "hall", inside: { row: 18, col: 11 }, outside: { row: 17, col: 11 } },
  { roomId: "hall", inside: { row: 18, col: 12 }, outside: { row: 17, col: 12 } },
  { roomId: "hall", inside: { row: 21, col: 14 }, outside: { row: 21, col: 15 } },
  { roomId: "study", inside: { row: 21, col: 18 }, outside: { row: 20, col: 18 } },
];

/** Bidirectional secret passages between opposite corner rooms. */
export const SECRET_PASSAGES: Readonly<Partial<Record<RoomId, RoomId>>> = {
  kitchen: "study",
  study: "kitchen",
  conservatory: "lounge",
  lounge: "conservatory",
};

/** Turn order: red first, then clockwise around the board. */
export const SEAT_ORDER: readonly CharacterId[] = [
  "red",
  "yellow",
  "white",
  "green",
  "blue",
  "purple",
];

/** Starting corridor cells on the board edge. */
export const START_POSITIONS: Readonly<Record<CharacterId, Position>> = {
  red: { row: 24, col: 7 },
  yellow: { row: 17, col: 0 },
  white: { row: 0, col: 7 },
  green: { row: 0, col: 16 },
  blue: { row: 6, col: 23 },
  purple: { row: 19, col: 23 },
};

export type CellKind = "corridor" | "room" | "void";

export interface Cell {
  readonly kind: CellKind;
  readonly roomId?: RoomId;
}

const inRect = (r: Rect, row: number, col: number): boolean =>
  row >= r.top && row <= r.bottom && col >= r.left && col <= r.right;

/** CELLS[row][col]; corridor = walkable, room = part of a room, void = centre. */
export const CELLS: readonly (readonly Cell[])[] = Array.from(
  { length: ROWS },
  (_, row) =>
    Array.from({ length: COLS }, (_, col): Cell => {
      if (inRect(CENTER_RECT, row, col)) return { kind: "void" };
      for (const [roomId, rect] of Object.entries(ROOM_RECTS))
        if (inRect(rect, row, col))
          return { kind: "room", roomId: roomId as RoomId };
      return { kind: "corridor" };
    }),
);

export function isCorridor(p: Position): boolean {
  return CELLS[p.row]?.[p.col]?.kind === "corridor";
}
