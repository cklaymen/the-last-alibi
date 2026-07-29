import { z } from "zod";

export const playerNameSchema = z
  .string()
  .trim()
  .min(2, "Podaj pseudonim o długości co najmniej 2 znaków.")
  .max(24, "Pseudonim może mieć maksymalnie 24 znaki.");

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}-\d{2}$/, "Kod pokoju ma format MYST-42.");

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
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type RoomSummary = z.infer<typeof roomSummarySchema>;
