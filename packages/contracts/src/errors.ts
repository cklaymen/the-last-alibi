import { z } from "zod";

/** Every error the server can report. The web translates `errors.<code>`. */
export const errorCodes = [
  // transport / session
  "INVALID_PAYLOAD",
  "UNAUTHORIZED",
  "ROOM_NOT_FOUND",
  "NAME_TAKEN",
  "INTERNAL",
  // domain (mirror of GameErrorCode in @mystery-game/game)
  "GAME_FULL",
  "PLAYER_ALREADY_JOINED",
  "PLAYER_NOT_FOUND",
  "CHARACTER_TAKEN",
  "NOT_HOST",
  "NOT_ENOUGH_PLAYERS",
  "CHARACTER_REQUIRED",
  "GAME_NOT_IN_LOBBY",
  "GAME_NOT_FINISHED",
  "CANNOT_KICK_SELF",
  "GAME_NOT_IN_PROGRESS",
  "NOT_YOUR_TURN",
  "PLAYER_ELIMINATED",
  "DISPROVE_PENDING",
  "ALREADY_ROLLED",
  "ALREADY_MOVED",
  "NOT_ROLLED",
  "UNREACHABLE",
  "NO_SECRET_PASSAGE",
  "CANNOT_SUGGEST",
  "NOT_YOUR_DISPROVE",
  "CARD_NOT_MATCHING",
  "NOT_IN_ROOM",
  "WRONG_ROOM",
  "ACCUSE_AFTER_SUGGESTION_DISABLED",
  "ALREADY_SUGGESTED",
  "INVALID_SETTINGS",
] as const;

export const errorCodeSchema = z.enum(errorCodes);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Body of every non-2xx HTTP response. */
export const errorResponseSchema = z.object({ code: errorCodeSchema });
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** Ack of every socket command. */
export type CommandResult = { ok: true } | { ok: false; code: ErrorCode };
