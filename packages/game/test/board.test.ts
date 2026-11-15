import { describe, expect, it } from "vitest";
import {
  CELLS,
  CENTER_RECT,
  COLS,
  DOORS,
  ROOM_RECTS,
  ROWS,
  SEAT_ORDER,
  SECRET_PASSAGES,
  START_POSITIONS,
  characterIds,
  isCorridor,
  roomIds,
  type CharacterId,
  type Location,
  type RoomId,
} from "../src/index.js";
import { reachableLocations } from "../src/movement/index.js";

/** Every other pawn parked in a room so the mover has a free board. */
function soloPawns(mover: CharacterId, at: Location): Record<CharacterId, Location> {
  return Object.fromEntries(
    characterIds.map((c) => [c, c === mover ? at : { kind: "room", roomId: "hall" }]),
  ) as Record<CharacterId, Location>;
}

function ascii(): string {
  const doorAt = new Map(DOORS.map((d) => [`${d.inside.row},${d.inside.col}`, d]));
  const startAt = new Map(
    Object.entries(START_POSITIONS).map(([c, p]) => [`${p.row},${p.col}`, c]),
  );
  const letter: Record<RoomId, string> = {
    kitchen: "K",
    ballroom: "B",
    conservatory: "C",
    dining_room: "D",
    billiard_room: "I",
    library: "L",
    lounge: "O",
    hall: "H",
    study: "S",
  };
  return CELLS.map((row, r) =>
    row
      .map((cell, c) => {
        const k = `${r},${c}`;
        if (startAt.has(k)) return (startAt.get(k) as string).charAt(0).toUpperCase();
        if (doorAt.has(k)) return "#";
        if (cell.kind === "void") return "X";
        if (cell.kind === "room") return letter[cell.roomId as RoomId].toLowerCase();
        return ".";
      })
      .join(""),
  ).join("\n");
}

describe("board layout", () => {
  it("has 25 rows of 24 cells", () => {
    expect(CELLS).toHaveLength(ROWS);
    for (const row of CELLS) expect(row).toHaveLength(COLS);
  });

  it("centre is void and not walkable", () => {
    for (let r = CENTER_RECT.top; r <= CENTER_RECT.bottom; r++)
      for (let c = CENTER_RECT.left; c <= CENTER_RECT.right; c++) {
        expect(CELLS[r]?.[c]?.kind).toBe("void");
        expect(isCorridor({ row: r, col: c })).toBe(false);
      }
  });

  it("isCorridor is false outside the board", () => {
    expect(isCorridor({ row: -1, col: 0 })).toBe(false);
    expect(isCorridor({ row: 0, col: COLS })).toBe(false);
    expect(isCorridor({ row: ROWS, col: 0 })).toBe(false);
  });

  it("every room has at least one door", () => {
    for (const r of roomIds) expect(DOORS.some((d) => d.roomId === r)).toBe(true);
  });

  it.each(DOORS.map((d) => [d.roomId, d.inside.row, d.inside.col, d] as const))(
    "door %s (%i,%i): inside on room edge, outside corridor and adjacent",
    (_, __, ___, d) => {
      const rect = ROOM_RECTS[d.roomId];
      expect(CELLS[d.inside.row]?.[d.inside.col]).toEqual({ kind: "room", roomId: d.roomId });
      const onEdge =
        d.inside.row === rect.top ||
        d.inside.row === rect.bottom ||
        d.inside.col === rect.left ||
        d.inside.col === rect.right;
      expect(onEdge).toBe(true);
      expect(isCorridor(d.outside)).toBe(true);
      expect(Math.abs(d.inside.row - d.outside.row) + Math.abs(d.inside.col - d.outside.col)).toBe(1);
    },
  );

  it("secret passages are symmetric pairs between corner rooms", () => {
    const corner = (r: RoomId) => {
      const rect = ROOM_RECTS[r];
      return (rect.top === 0 || rect.bottom === ROWS - 1) && (rect.left === 0 || rect.right === COLS - 1);
    };
    const entries = Object.entries(SECRET_PASSAGES) as [RoomId, RoomId][];
    expect(entries).toHaveLength(4);
    for (const [from, to] of entries) {
      expect(SECRET_PASSAGES[to]).toBe(from);
      expect(from).not.toBe(to);
      expect(corner(from)).toBe(true);
      expect(corner(to)).toBe(true);
      const a = ROOM_RECTS[from];
      const b = ROOM_RECTS[to];
      // opposite corners
      expect(a.top === 0).not.toBe(b.top === 0);
      expect(a.left === 0).not.toBe(b.left === 0);
    }
  });

  it("start positions are distinct corridor cells on the board edge", () => {
    expect([...SEAT_ORDER].sort()).toEqual([...characterIds].sort());
    const keys = new Set<string>();
    for (const c of characterIds) {
      const p = START_POSITIONS[c];
      expect(isCorridor(p)).toBe(true);
      expect(p.row === 0 || p.row === ROWS - 1 || p.col === 0 || p.col === COLS - 1).toBe(true);
      keys.add(`${p.row},${p.col}`);
    }
    expect(keys.size).toBe(6);
  });

  it.each([...characterIds])("every room is reachable from %s start", (c) => {
    const rooms = reachableLocations(
      soloPawns(c, { kind: "cell", position: START_POSITIONS[c] }),
      c,
      200,
      null,
    )
      .filter((l) => l.kind === "room")
      .map((l) => (l.kind === "room" ? l.roomId : null));
    expect(rooms).toEqual([...roomIds]);
  });

  it.each([...roomIds])("every other room is reachable from inside %s", (r) => {
    const rooms = reachableLocations(soloPawns("red", { kind: "room", roomId: r }), "red", 200, null)
      .filter((l) => l.kind === "room")
      .map((l) => (l.kind === "room" ? l.roomId : null));
    expect(rooms).toEqual(roomIds.filter((x) => x !== r));
  });

  it("all corridor cells form one connected area", () => {
    const all = reachableLocations(
      soloPawns("red", { kind: "cell", position: START_POSITIONS.red }),
      "red",
      1000,
      null,
    ).filter((l) => l.kind === "cell");
    const corridorCount = CELLS.flat().filter((c) => c.kind === "corridor").length;
    expect(all).toHaveLength(corridorCount - 1);
  });

  it("ASCII snapshot", () => {
    expect("\n" + ascii() + "\n").toMatchInlineSnapshot(`
      "
      kkkkkk.WbbbbbbbbG.cccccc
      kkkkkk..bbbbbbbb..cccccc
      kkkkkk..#bbbbbb#..cccccc
      kkkkk#..bbbbbbbb..cccccc
      kkkkkk..bbbbbbbb..c#cccc
      kkkk#k..bbbbbbbb........
      ........b#bbbb#b.......B
      ........................
      ..................ii#iii
      dddd#dd..XXXXXX...iiiiii
      ddddddd..XXXXXX...iiiiii
      ddddddd..XXXXXX...#iiiii
      dddddd#..XXXXXX...iiiiii
      ddddddd..XXXXXX.........
      ddddddd..XXXXXX..lll#lll
      ddddd#d..XXXXXX..lllllll
      .................#llllll
      Y................lllllll
      .........hh##hh..lllllll
      oooooo#..hhhhhh........P
      ooooooo..hhhhhh.........
      ooooooo..hhhhh#..s#sssss
      ooooooo..hhhhhh..sssssss
      ooooooo..hhhhhh..sssssss
      oooooooR.hhhhhh..sssssss
      "
    `);
  });
});
