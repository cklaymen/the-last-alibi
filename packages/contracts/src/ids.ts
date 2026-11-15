import { z } from "zod";
import { characterIds, roomIds, weaponIds } from "@mystery-game/game";

export { characterIds, roomIds, weaponIds };
export type { CardId, CharacterId, RoomId, WeaponId, ActionId } from "@mystery-game/game";

export const characterIdSchema = z.enum(characterIds);
export const weaponIdSchema = z.enum(weaponIds);
export const roomIdSchema = z.enum(roomIds);
export const cardIdSchema = z.union([characterIdSchema, weaponIdSchema, roomIdSchema]);
