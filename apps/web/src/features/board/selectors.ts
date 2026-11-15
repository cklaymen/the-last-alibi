import type { Location, PublicGameState } from "@mystery-game/contracts";
import {
  ROOM_RECTS,
  characterIds,
  weaponIds,
  type CharacterId,
  type RoomId,
  type WeaponId,
} from "@mystery-game/game";
import { myPlayer } from "../players/index.js";
import { cellCenter, roomSlot, type Point } from "./geometry.js";

export function pawnLocation(
  game: PublicGameState,
  characterId: CharacterId,
): Location | undefined {
  return game.pawns.find((p) => p.characterId === characterId)?.location;
}

/** Where my own pawn stands. */
export function myLocation(game: PublicGameState, myId: string): Location | undefined {
  const me = myPlayer(game, myId);
  return me ? pawnLocation(game, me.characterId) : undefined;
}

/** The room my pawn is in, or null when it stands on a corridor. */
export function myRoom(game: PublicGameState, myId: string): RoomId | null {
  const loc = myLocation(game, myId);
  return loc?.kind === "room" ? loc.roomId : null;
}

export interface RoomContents {
  pawns: CharacterId[];
  weapons: WeaponId[];
}

/** Pawns and weapons per room, each in canonical id order (stable slots). */
export function roomSlots(game: PublicGameState): Partial<Record<RoomId, RoomContents>> {
  const out: Partial<Record<RoomId, RoomContents>> = {};
  const get = (r: RoomId) => (out[r] ??= { pawns: [], weapons: [] });
  for (const id of characterIds) {
    const loc = pawnLocation(game, id);
    if (loc?.kind === "room") get(loc.roomId).pawns.push(id);
  }
  for (const id of weaponIds) {
    const w = game.weapons.find((x) => x.weaponId === id);
    if (w) get(w.roomId).weapons.push(id);
  }
  return out;
}

export interface PlacedPawn {
  characterId: CharacterId;
  location: Location;
  point: Point;
}

export interface PlacedWeapon {
  weaponId: WeaponId;
  roomId: RoomId;
  point: Point;
}

/** Board coordinates for every pawn (cell centre or a free slot in the room). */
export function placePawns(game: PublicGameState): PlacedPawn[] {
  const slots = roomSlots(game);
  const placed: PlacedPawn[] = [];
  for (const characterId of characterIds) {
    const location = pawnLocation(game, characterId);
    if (!location) continue;
    const point =
      location.kind === "cell"
        ? cellCenter(location.position)
        : roomSlot(
            ROOM_RECTS[location.roomId],
            "pawn",
            slots[location.roomId]?.pawns.indexOf(characterId) ?? 0,
          );
    placed.push({ characterId, location, point });
  }
  return placed;
}

export function placeWeapons(game: PublicGameState): PlacedWeapon[] {
  const slots = roomSlots(game);
  return weaponIds.flatMap((weaponId) => {
    const w = game.weapons.find((x) => x.weaponId === weaponId);
    if (!w) return [];
    const index = slots[w.roomId]?.weapons.indexOf(weaponId) ?? 0;
    return [{ weaponId, roomId: w.roomId, point: roomSlot(ROOM_RECTS[w.roomId], "weapon", index) }];
  });
}

export function locationKey(loc: Location): string {
  return loc.kind === "room" ? `room:${loc.roomId}` : `cell:${loc.position.row}:${loc.position.col}`;
}
