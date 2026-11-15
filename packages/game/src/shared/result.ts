import type { Game } from "./types.js";

export type GameErrorCode =
  // lobby
  | "GAME_FULL"
  | "PLAYER_ALREADY_JOINED"
  | "PLAYER_NOT_FOUND"
  | "CHARACTER_TAKEN"
  | "NOT_HOST"
  | "NOT_ENOUGH_PLAYERS"
  | "CHARACTER_REQUIRED"
  | "GAME_NOT_IN_LOBBY"
  | "GAME_NOT_FINISHED"
  | "NAME_TAKEN"
  | "CANNOT_KICK_SELF"
  // play
  | "GAME_NOT_IN_PROGRESS"
  | "NOT_YOUR_TURN"
  | "PLAYER_ELIMINATED"
  | "DISPROVE_PENDING"
  | "ALREADY_ROLLED"
  | "ALREADY_MOVED"
  | "NOT_ROLLED"
  | "UNREACHABLE"
  | "NO_SECRET_PASSAGE"
  | "CANNOT_SUGGEST"
  | "NOT_YOUR_DISPROVE"
  | "CARD_NOT_MATCHING";

export type GameResult =
  | { readonly ok: true; readonly game: Game }
  | { readonly ok: false; readonly code: GameErrorCode };

export const ok = (game: Game): GameResult => ({ ok: true, game });
export const fail = (code: GameErrorCode): GameResult => ({ ok: false, code });
