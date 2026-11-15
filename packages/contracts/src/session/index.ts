import { z } from "zod";

export const playerNameSchema = z.string().trim().min(2).max(24);
export const roomCodeSchema = z.string().trim().regex(/^\d{4,6}$/);

export const sessionSchema = z.object({
  playerId: z.string(),
  token: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;
