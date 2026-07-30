import { z } from "zod";

export const playerNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a nickname with at least 2 characters.")
  .max(24, "A nickname can contain at most 24 characters.");

export const roomCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "A room code is 4 to 6 digits.");

// Keep in sync with packages/game/src/types.ts characterIds
export const characterIds = [
  "scarlet",
  "mustard",
  "orchid",
  "peacock",
  "plum",
  "green",
] as const;

export type CharacterId = (typeof characterIds)[number];

export const createRoomSchema = z.object({
  playerName: playerNameSchema,
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
});

export const playerSummarySchema = z.object({
  id: z.string().uuid(),
  name: playerNameSchema,
  characterId: z.enum(characterIds).optional(),
  isReady: z.boolean(),
});

export const roomSummarySchema = z.object({
  id: z.string().uuid(),
  code: roomCodeSchema,
  hostName: playerNameSchema,
  playerCount: z.number().int().min(1).max(6),
  maxPlayers: z.literal(6),
  phase: z.enum(["LOBBY", "IN_PROGRESS", "FINISHED"]),
  players: z.array(playerSummarySchema),
});

export const subscribeRoomSchema = z.object({ roomCode: roomCodeSchema });

export const startRoomSchema = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema,
});

export const chooseCharacterSchema = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema,
  characterId: z.enum(characterIds),
});

export const setReadySchema = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema,
  isReady: z.boolean(),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type PlayerSummary = z.infer<typeof playerSummarySchema>;
export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type SubscribeRoomRequest = z.infer<typeof subscribeRoomSchema>;
export type StartRoomRequest = z.infer<typeof startRoomSchema>;
export type ChooseCharacterRequest = z.infer<typeof chooseCharacterSchema>;
export type SetReadyRequest = z.infer<typeof setReadySchema>;
