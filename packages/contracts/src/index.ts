import { z } from "zod";

export const playerNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a nickname with at least 2 characters.")
  .max(24, "A nickname can contain at most 24 characters.");

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}-\d{2}$/, "A room code uses the format MYST-42.");

export const createRoomSchema = z.object({
  playerName: playerNameSchema,
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
});

export const roomSummarySchema = z.object({
  id: z.string().uuid(),
  code: roomCodeSchema,
  hostName: playerNameSchema,
  playerCount: z.number().int().min(1).max(6),
  maxPlayers: z.literal(6),
  phase: z.enum(["LOBBY", "IN_PROGRESS"]),
});

export const subscribeRoomSchema = z.object({ roomCode: roomCodeSchema });

export const startRoomSchema = z.object({
  roomCode: roomCodeSchema,
  playerName: playerNameSchema,
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type SubscribeRoomRequest = z.infer<typeof subscribeRoomSchema>;
export type StartRoomRequest = z.infer<typeof startRoomSchema>;
