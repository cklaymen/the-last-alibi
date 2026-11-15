import type { GameErrorCode } from "./result.js";
import { characterOf } from "./play.js";
import type { CharacterId, Game, Location, PlayState, PlayerId, Turn } from "./types.js";

/** Everything a turn command needs once the common guards passed. */
export interface TurnContext {
  readonly game: Game;
  readonly play: PlayState;
  readonly turn: Turn;
  readonly playerId: PlayerId;
  readonly character: CharacterId;
  readonly location: Location;
}

export type Guarded<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: GameErrorCode };

export function inProgress(game: Game): PlayState | null {
  return game.phase === "IN_PROGRESS" && game.play ? game.play : null;
}

/**
 * Common guard order for turn commands:
 * GAME_NOT_IN_PROGRESS → PLAYER_NOT_FOUND → PLAYER_ELIMINATED → NOT_YOUR_TURN → DISPROVE_PENDING.
 */
export function requireActivePlayer(game: Game, playerId: PlayerId): Guarded<TurnContext> {
  const play = inProgress(game);
  if (!play) return { ok: false, code: "GAME_NOT_IN_PROGRESS" };
  const character = characterOf(game, playerId);
  if (!character || !play.turnOrder.includes(playerId))
    return { ok: false, code: "PLAYER_NOT_FOUND" };
  if (play.eliminated.includes(playerId)) return { ok: false, code: "PLAYER_ELIMINATED" };
  if (play.turn.playerId !== playerId) return { ok: false, code: "NOT_YOUR_TURN" };
  if (play.turn.pendingSuggestion) return { ok: false, code: "DISPROVE_PENDING" };
  return {
    ok: true,
    value: { game, play, turn: play.turn, playerId, character, location: play.pawns[character] },
  };
}
