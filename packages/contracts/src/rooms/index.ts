import { z } from "zod";
import { characterIdSchema } from "../ids.js";
import { tripleSchema } from "../game/index.js";
import { playerNameSchema, roomCodeSchema, sessionSchema } from "../session/index.js";

export const createRoomSchema = z.object({ playerName: playerNameSchema });
export const joinRoomSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
});

/**
 * online  – at least one connected socket;
 * offline – disconnected for less than the grace period (30 s);
 * away    – disconnected longer (only during a game: turns are skipped and
 *           the server shows cards for them; in the lobby they are removed).
 */
export const presenceSchema = z.enum(["online", "offline", "away"]);

export const playerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  characterId: characterIdSchema.optional(),
  presence: presenceSchema,
});

/** Result of the previous game in this room (shown in the lobby). */
export const lastResultSchema = z.object({
  winnerId: z.string(),
  winnerName: z.string(),
  reason: z.enum(["ACCUSATION", "LAST_STANDING"]),
  envelope: tripleSchema,
});

export const roomSummarySchema = z.object({
  /** Current game id; changes on restart (notebook is keyed by it). */
  id: z.string(),
  code: roomCodeSchema,
  hostId: z.string(),
  maxPlayers: z.number().int(),
  phase: z.enum(["LOBBY", "IN_PROGRESS", "FINISHED"]),
  players: z.array(playerSummarySchema),
  lastResult: lastResultSchema.nullable(),
});

/** Response of POST /rooms, POST /rooms/join and GET /rooms/:code/session. */
export const roomSessionResponseSchema = z.object({
  room: roomSummarySchema,
  session: sessionSchema,
});

export const chooseCharacterSchema = z.object({ characterId: characterIdSchema });
export const kickPlayerSchema = z.object({ playerId: z.string() });
export const renamePlayerSchema = z.object({ name: playerNameSchema });

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type PlayerSummary = z.infer<typeof playerSummarySchema>;
export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type RoomSessionResponse = z.infer<typeof roomSessionResponseSchema>;
export type ChooseCharacterRequest = z.infer<typeof chooseCharacterSchema>;
export type KickPlayerRequest = z.infer<typeof kickPlayerSchema>;
export type RenamePlayerRequest = z.infer<typeof renamePlayerSchema>;
export type Presence = z.infer<typeof presenceSchema>;
export type LastResult = z.infer<typeof lastResultSchema>;
