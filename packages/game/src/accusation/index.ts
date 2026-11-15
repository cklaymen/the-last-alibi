import { requireActivePlayer } from "../shared/guards.js";
import { passTurn, withEvents, withPlay } from "../shared/play.js";
import { fail, ok, type GameResult } from "../shared/result.js";
import type { Accusation, Game, PlayerId } from "../shared/types.js";

export function makeAccusation(game: Game, playerId: PlayerId, accusation: Accusation): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
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
