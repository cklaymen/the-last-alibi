import { requireActivePlayer, inProgress, type TurnContext } from "../shared/guards.js";
import { playerOfCharacter, withEvents, withPlay } from "../shared/play.js";
import { pick } from "../shared/random.js";
import { fail, ok, type GameErrorCode, type GameResult } from "../shared/result.js";
import type {
  CardId,
  CharacterId,
  Game,
  GameEvent,
  PendingSuggestion,
  PlayerId,
  Rng,
  RoomId,
  Suggestion,
  WeaponId,
} from "../shared/types.js";

export function matchingCards(hand: readonly CardId[], suggestion: Suggestion): CardId[] {
  return hand.filter(
    (c) => c === suggestion.suspect || c === suggestion.weapon || c === suggestion.room,
  );
}

/** Command-specific guard for suggesting; returns the room of the suggestion. */
export function suggestionRoomFor(ctx: TurnContext): { code: GameErrorCode } | { room: RoomId } {
  const { location, turn } = ctx;
  if (location.kind !== "room" || location.roomId !== turn.suggestionRoom || turn.hasSuggested)
    return { code: "CANNOT_SUGGEST" };
  return { room: location.roomId };
}

export function makeSuggestion(
  game: Game,
  playerId: PlayerId,
  suspect: CharacterId,
  weapon: WeaponId,
): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  const allowed = suggestionRoomFor(g.value);
  if ("code" in allowed) return fail(allowed.code);
  const { room } = allowed;
  const { play } = g.value;
  const suggestion: Suggestion = { suspect, weapon, room };

  const summonedPlayer = playerOfCharacter(game, suspect);
  const suspectLoc = play.pawns[suspect];
  const alreadyThere = suspectLoc.kind === "room" && suspectLoc.roomId === room;
  const summonedTo =
    summonedPlayer && summonedPlayer !== playerId && !alreadyThere
      ? { ...play.summonedTo, [summonedPlayer]: room }
      : play.summonedTo;

  const events: GameEvent[] = [{ type: "suggested", playerId, suggestion }];
  let pending: PendingSuggestion | null = null;
  const order = play.turnOrder;
  const start = order.indexOf(playerId);
  for (let i = 1; i < order.length && !pending; i++) {
    const candidate = order[(start + i) % order.length] as PlayerId;
    if (matchingCards(play.hands[candidate] ?? [], suggestion).length > 0)
      pending = { suggesterId: playerId, suggestion, disproverId: candidate };
    else events.push({ type: "cannot_disprove", playerId: candidate });
  }
  if (!pending) events.push({ type: "no_one_disproved", suggesterId: playerId });

  return ok(
    withPlay(
      game,
      withEvents(
        {
          ...play,
          pawns: { ...play.pawns, [suspect]: { kind: "room", roomId: room } },
          weapons: { ...play.weapons, [weapon]: room },
          summonedTo,
          turn: { ...play.turn, hasSuggested: true, pendingSuggestion: pending },
        },
        ...events,
      ),
    ),
  );
}

/** True when `playerId` must show a card now (eliminated players included). */
export function isDisprover(game: Game, playerId: PlayerId): boolean {
  return inProgress(game)?.turn.pendingSuggestion?.disproverId === playerId;
}

export function disprove(game: Game, playerId: PlayerId, cardId: CardId): GameResult {
  const play = inProgress(game);
  if (!play) return fail("GAME_NOT_IN_PROGRESS");
  const pending = play.turn.pendingSuggestion;
  if (!pending || pending.disproverId !== playerId) return fail("NOT_YOUR_DISPROVE");
  if (!matchingCards(play.hands[playerId] ?? [], pending.suggestion).includes(cardId))
    return fail("CARD_NOT_MATCHING");
  return ok(
    withPlay(
      game,
      withEvents(
        {
          ...play,
          reveals: [...play.reveals, { toPlayerId: pending.suggesterId, fromPlayerId: playerId, cardId }],
          turn: { ...play.turn, pendingSuggestion: null },
        },
        { type: "card_shown", playerId, toPlayerId: pending.suggesterId },
      ),
    ),
  );
}

/**
 * The pending disprover shows a random matching card (chosen with `rng`).
 * Reason "timeout" emits `disprove_timed_out` right before `card_shown`.
 */
export function autoDisprove(game: Game, rng: Rng, reason: "timeout" | "away"): GameResult {
  const play = inProgress(game);
  if (!play) return fail("GAME_NOT_IN_PROGRESS");
  const pending = play.turn.pendingSuggestion;
  if (!pending) return fail("NOT_YOUR_DISPROVE");
  const { disproverId } = pending;
  const options = matchingCards(play.hands[disproverId] ?? [], pending.suggestion);
  const before =
    reason === "timeout"
      ? withPlay(game, withEvents(play, { type: "disprove_timed_out", playerId: disproverId }))
      : game;
  return disprove(before, disproverId, pick(options, rng));
}
