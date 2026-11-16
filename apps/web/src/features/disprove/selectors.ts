import type { CardId } from "@mystery-game/game";
import type { GameEvent, PrivateGameState, PublicGameState, Triple } from "@mystery-game/contracts";

export type SeenCard = PrivateGameState["seenCards"][number];

export type SuggestionOutcome =
  | { kind: "pending"; suggesterId: string; disproverId: string }
  | { kind: "none"; suggesterId: string }
  /** `cardId` is set only for the suggester. */
  | { kind: "shown"; suggesterId: string; byId: string; cardId: CardId | null };

const turnEnds: ReadonlySet<GameEvent["type"]> = new Set(["turn_ended", "turn_skipped", "turn_timed_out"]);

/** Index of the current turn's last `suggested` event, or -1. */
function currentSuggestionIndex(events: readonly GameEvent[]): number {
  const idx = events.findLastIndex((e) => e.type === "suggested" || turnEnds.has(e.type));
  return events[idx]?.type === "suggested" ? idx : -1;
}

/** The suggestion made in the current turn (until the turn ends), or null. */
export function currentTurnSuggestion(
  game: PublicGameState,
): { suggesterId: string; suggestion: Triple } | null {
  const events = game.events.map((e) => e.event);
  const suggested = events[currentSuggestionIndex(events)];
  return suggested?.type === "suggested"
    ? { suggesterId: suggested.playerId, suggestion: suggested.suggestion }
    : null;
}

/**
 * Result of the current turn's suggestion as seen by `me`; null when there is
 * no suggestion in this turn. Only the suggester learns which card was shown.
 */
export function suggestionOutcome(game: PublicGameState, me: PrivateGameState): SuggestionOutcome | null {
  const events = game.events.map((e) => e.event);
  const idx = currentSuggestionIndex(events);
  const suggested = events[idx];
  if (suggested?.type !== "suggested") return null;
  const suggesterId = suggested.playerId;

  for (const e of events.slice(idx + 1)) {
    if (e.type === "no_one_disproved") return { kind: "none", suggesterId };
    if (e.type === "card_shown") {
      return { kind: "shown", suggesterId, byId: e.playerId, cardId: shownToMe(me, suggesterId, e.playerId) };
    }
  }
  const pending = game.turn.pendingSuggestion;
  return pending ? { kind: "pending", suggesterId, disproverId: pending.disproverId } : null;
}

/** The newest card `byId` showed me, if I am the suggester. */
function shownToMe(me: PrivateGameState, suggesterId: string, byId: string): CardId | null {
  if (me.playerId !== suggesterId) return null;
  const last = me.seenCards.at(-1);
  return last && last.fromPlayerId === byId ? last.cardId : null;
}
