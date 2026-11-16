import { requireActivePlayer, type TurnContext } from "../shared/guards.js";
import { passTurn, withEvents, withPlay } from "../shared/play.js";
import { fail, ok, type GameErrorCode, type GameResult } from "../shared/result.js";
import type { Accusation, Game, PlayerId } from "../shared/types.js";

/**
 * House-rule checks for an accusation (after the common turn guards):
 * NOT_IN_ROOM (pawn on a corridor) → ACCUSE_AFTER_SUGGESTION_DISABLED →
 * WRONG_ROOM (only when `accusation` is given and the room must be the current one).
 */
export function accusationError(ctx: TurnContext, accusation?: Accusation): GameErrorCode | null {
  const { location, turn, game } = ctx;
  if (location.kind !== "room") return "NOT_IN_ROOM";
  if (!game.settings.accuseAfterSuggestion && turn.hasSuggested)
    return "ACCUSE_AFTER_SUGGESTION_DISABLED";
  if (accusation && game.settings.accusationPlace === "named_room" && accusation.room !== location.roomId)
    return "WRONG_ROOM";
  return null;
}

export function makeAccusation(game: Game, playerId: PlayerId, accusation: Accusation): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  const error = accusationError(g.value, accusation);
  if (error) return fail(error);
  const { play } = g.value;
  const { envelope } = play;
  const correct =
    accusation.suspect === envelope.suspect &&
    accusation.weapon === envelope.weapon &&
    accusation.room === envelope.room;
  const accused = withEvents(play, { type: "accused", playerId, accusation, correct });

  if (correct) {
    return ok({
      ...game,
      phase: "FINISHED",
      play: {
        ...withEvents(accused, { type: "game_won", playerId, reason: "ACCUSATION" }),
        winner: { playerId, reason: "ACCUSATION" },
      },
    });
  }

  const eliminated = [...play.eliminated, playerId];
  const afterElimination = { ...accused, eliminated };
  const remaining = play.turnOrder.filter((id) => !eliminated.includes(id));
  if (remaining.length === 1) {
    const winnerId = remaining[0] as PlayerId;
    return ok({
      ...game,
      phase: "FINISHED",
      play: {
        ...withEvents(afterElimination, {
          type: "game_won",
          playerId: winnerId,
          reason: "LAST_STANDING",
        }),
        winner: { playerId: winnerId, reason: "LAST_STANDING" },
      },
    });
  }
  return ok(withPlay(game, passTurn(afterElimination, playerId)));
}
