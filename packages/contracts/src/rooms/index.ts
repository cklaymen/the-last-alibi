import { z } from "zod";
import { characterIdSchema } from "../ids.js";
import { playerNameSchema, roomCodeSchema, sessionSchema } from "../session/index.js";

export const createRoomSchema = z.object({ playerName: playerNameSchema });
export const joinRoomSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
});

export const playerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  characterId: characterIdSchema.optional(),
});

export const roomSummarySchema = z.object({
  /** Current game id; changes on restart (notebook is keyed by it). */
  id: z.string(),
  code: roomCodeSchema,
  hostId: z.string(),
  maxPlayers: z.number().int(),
  phase: z.enum(["LOBBY", "IN_PROGRESS", "FINISHED"]),
  players: z.array(playerSummarySchema),
});

/** Response of POST /rooms, POST /rooms/join and GET /rooms/:code/session. */
export const roomSessionResponseSchema = z.object({
  room: roomSummarySchema,
  session: sessionSchema,
});

export const chooseCharacterSchema = z.object({ characterId: characterIdSchema });

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type PlayerSummary = z.infer<typeof playerSummarySchema>;
export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type RoomSessionResponse = z.infer<typeof roomSessionResponseSchema>;
export type ChooseCharacterRequest = z.infer<typeof chooseCharacterSchema>;
