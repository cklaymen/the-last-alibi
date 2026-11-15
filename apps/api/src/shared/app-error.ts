import type { ErrorCode } from "@mystery-game/contracts";

/** Error carrying a contract error code; translated to HTTP/ack by the transport layer. */
export class AppError extends Error {
  public constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = "AppError";
  }
}

/** HTTP status for every error code (exhaustive). */
export const errorStatus: Readonly<Record<ErrorCode, number>> = {
  INVALID_PAYLOAD: 400,
  UNAUTHORIZED: 401,
  ROOM_NOT_FOUND: 404,
  NAME_TAKEN: 409,
  INTERNAL: 500,
  GAME_FULL: 409,
  PLAYER_ALREADY_JOINED: 409,
  PLAYER_NOT_FOUND: 404,
  CHARACTER_TAKEN: 409,
  NOT_HOST: 403,
  NOT_ENOUGH_PLAYERS: 409,
  CHARACTER_REQUIRED: 409,
  GAME_NOT_IN_LOBBY: 409,
  GAME_NOT_FINISHED: 409,
  GAME_NOT_IN_PROGRESS: 409,
  NOT_YOUR_TURN: 403,
  PLAYER_ELIMINATED: 403,
  DISPROVE_PENDING: 409,
  ALREADY_ROLLED: 409,
  ALREADY_MOVED: 409,
  NOT_ROLLED: 409,
  UNREACHABLE: 400,
  NO_SECRET_PASSAGE: 400,
  CANNOT_SUGGEST: 400,
  NOT_YOUR_DISPROVE: 403,
  CARD_NOT_MATCHING: 400,
};
