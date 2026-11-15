import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";

export type SeenCard = PrivateGameState["seenCards"][number];

/**
 * The card just shown to me for the suggestion I made in my current turn, or
 * null. Used to highlight the fresh result until my turn ends.
 */
export function latestShownToMe(game: PublicGameState, me: PrivateGameState): SeenCard | null {
  if (game.turn.playerId !== me.playerId) return null;
  const events = game.events.map((e) => e.event);
  const idx = events.findLastIndex((e) => e.type === "suggested" || e.type === "turn_ended");
  const suggestion = events[idx];
  if (suggestion?.type !== "suggested" || suggestion.playerId !== me.playerId) return null;
  const shown = events
    .slice(idx + 1)
    .find((e) => e.type === "card_shown" && e.toPlayerId === me.playerId);
  if (shown?.type !== "card_shown") return null;
  const last = me.seenCards.at(-1);
  return last && last.fromPlayerId === shown.playerId ? last : null;
}
