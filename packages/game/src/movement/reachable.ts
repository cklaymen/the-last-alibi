import { DOORS, isCorridor } from "../board/layout.js";
import { roomIds, type CharacterId, type Location, type Position, type RoomId } from "../shared/types.js";

const key = (p: Position): string => `${p.row},${p.col}`;
const STEPS: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Destinations for a pawn moving "up to" `steps` squares orthogonally over
 * free corridor cells. Entering a room costs one step from its door's
 * outside cell and ends the move. The current room and `leftRoom` are
 * never included. Order: cells by row/col, then rooms in `roomIds` order.
 */
export function reachableLocations(
  pawns: Readonly<Record<CharacterId, Location>>,
  mover: CharacterId,
  steps: number,
  leftRoom: RoomId | null,
): Location[] {
  if (steps <= 0) return [];
  const from = pawns[mover];
  const occupied = new Set<string>();
  for (const [c, loc] of Object.entries(pawns))
    if (c !== mover && loc.kind === "cell") occupied.add(key(loc.position));

  const dist = new Map<string, number>();
  const cells = new Map<string, Position>();
  const queue: Position[] = [];
  const visit = (p: Position, d: number) => {
    const k = key(p);
    if (dist.has(k) || occupied.has(k) || !isCorridor(p)) return;
    dist.set(k, d);
    cells.set(k, p);
    queue.push(p);
  };

  if (from.kind === "cell") visit(from.position, 0);
  else for (const door of DOORS) if (door.roomId === from.roomId) visit(door.outside, 1);

  for (let i = 0; i < queue.length; i++) {
    const p = queue[i] as Position;
    const d = dist.get(key(p)) as number;
    if (d >= steps) continue;
    for (const [dr, dc] of STEPS) visit({ row: p.row + dr, col: p.col + dc }, d + 1);
  }

  const cellLocs: Location[] = [...cells.entries()]
    .filter(([k]) => (dist.get(k) as number) >= 1)
    .map(([, position]) => position)
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((position) => ({ kind: "cell", position }));

  const currentRoom = from.kind === "room" ? from.roomId : null;
  const roomLocs: Location[] = roomIds
    .filter((r) => r !== currentRoom && r !== leftRoom)
    .filter((r) =>
      DOORS.some(
        (d) => d.roomId === r && (dist.get(key(d.outside)) ?? Infinity) <= steps - 1,
      ),
    )
    .map((roomId) => ({ kind: "room", roomId }));

  return [...cellLocs, ...roomLocs];
}
