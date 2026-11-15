import { pick } from "../shared/random.js";
import { nextPlayer, startTurn, withEvents, withPlay } from "../shared/play.js";
import type { Game, PlayState, PlayerId, Rng } from "../shared/types.js";
import { disprove, matchingCards } from "../suggestion/index.js";

/**
 * Applies the rules for players who are away (offline for too long) during a
 * game, until the state is stable:
 * - an away disprover automatically shows a random matching card;
 * - an away active player's turn is skipped (event `turn_skipped`) once no
 *   suggestion is waiting – unless every remaining player is away.
 * Returns the game unchanged when nothing applies.
 */
export function resolveAway(game: Game, away: readonly PlayerId[], rng: Rng): Game {
  let current = game;
  // Each iteration resolves one disprove or one skip; bounded by player count.
  for (let guard = 0; guard < 2 * (game.play?.turnOrder.length ?? 0) + 2; guard++) {
    const play = current.play;
    if (current.phase !== "IN_PROGRESS" || !play) return current;

    const pending = play.turn.pendingSuggestion;
    if (pending) {
      if (!away.includes(pending.disproverId)) return current;
      const options = matchingCards(play.hands[pending.disproverId] ?? [], pending.suggestion);
      const result = disprove(current, pending.disproverId, pick(options, rng));
      if (!result.ok) return current;
      current = result.game;
      continue;
    }

    const active = play.turn.playerId;
    if (!away.includes(active) || everyoneAway(play, away)) return current;
    current = withPlay(current, skipTurn(play, active));
  }
  return current;
}

function everyoneAway(play: PlayState, away: readonly PlayerId[]): boolean {
  return play.turnOrder
    .filter((id) => !play.eliminated.includes(id))
    .every((id) => away.includes(id));
}

function skipTurn(play: PlayState, playerId: PlayerId): PlayState {
  const skipped = withEvents(play, { type: "turn_skipped", playerId });
  return startTurn(skipped, nextPlayer(skipped, playerId));
}
