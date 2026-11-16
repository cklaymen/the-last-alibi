import { z } from "zod";
import {
  MAX_ROOM_CARDS,
  accusationPlaces,
  disproveTimeLimits,
  turnTimeLimits,
  type RoomSettings as DomainRoomSettings,
} from "@mystery-game/game";

export { MAX_ROOM_CARDS, accusationPlaces, disproveTimeLimits, turnTimeLimits };

/** House rules of a room; set by the host in the lobby, visible to all players. */
export const roomSettingsSchema = z.object({
  accusationPlace: z.enum(accusationPlaces),
  accuseAfterSuggestion: z.boolean(),
  suggestAfterStaying: z.boolean(),
  /** Seconds; null = no limit. */
  turnTimeLimitSec: z.literal(turnTimeLimits),
  /** Seconds; null = no limit. */
  disproveTimeLimitSec: z.literal(disproveTimeLimits),
  roomCards: z.number().int().min(0).max(MAX_ROOM_CARDS),
  autoNotes: z.boolean(),
});

/** Payload of `room:settings`: only the fields to change. */
export const updateSettingsSchema = roomSettingsSchema.partial();

export type RoomSettings = z.infer<typeof roomSettingsSchema>;
export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;

// Compile-time guard: the contract mirrors the domain type exactly.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _settingsMirrorDomain: Same<RoomSettings, DomainRoomSettings> = true;
void _settingsMirrorDomain;
