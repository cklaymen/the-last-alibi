import { useCallback, useContext, useMemo } from "react";
import type { CardId } from "@mystery-game/game";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { GameContext } from "../game/index.js";
import { deduce, factsOnly, type Deduction, type DeductionInput } from "./deduction.js";
import { effectiveMark, notebookKey, type Mark } from "./notebookModel.js";
import { useManualMarks } from "./notebookStore.js";

/** Deduction input from what the server sent me. */
export function deductionInput(game: PublicGameState, me: PrivateGameState | null, myId: string): DeductionInput {
  return {
    myId,
    players: game.turnOrder.map((id) => ({ id, cardCount: game.players.find((p) => p.id === id)?.cardCount ?? 0 })),
    events: game.events.map((e) => e.event),
    hand: me?.hand ?? [],
    seenCards: me?.seenCards ?? [],
    roomCards: me?.roomCards.map((r) => r.cardId) ?? [],
  };
}

/** Automatic notebook values (or facts only when the host turned automatic notes off). */
export function useDeduction(game: PublicGameState, me: PrivateGameState | null, myId: string): Deduction {
  return useMemo(() => {
    const input = deductionInput(game, me, myId);
    return game.settings.autoNotes ? deduce(input) : factsOnly(input);
  }, [game, me, myId]);
}

/** Automatic general mark: ✓ for my own / known-located cards. */
export function autoGeneral(d: Deduction, hand: readonly CardId[], card: CardId): Mark {
  return hand.includes(card) || d.general[card] === "has" ? "has" : "empty";
}

/**
 * Read-only general mark per card for the card pickers (manual wins over
 * automatic). Returns "empty" for everything outside a game.
 */
export function useNotebookMarks(): (card: CardId) => Mark {
  const ctx = useContext(GameContext);
  const game = ctx?.game ?? null;
  const me = ctx?.me ?? null;
  const myId = ctx?.myId ?? "";
  const manual = useManualMarks(game ? notebookKey(game.gameId, myId) : null);
  const deduction = useMemo(
    () => (game ? (game.settings.autoNotes ? deduce : factsOnly)(deductionInput(game, me, myId)) : null),
    [game, me, myId],
  );
  return useCallback(
    (card: CardId) =>
      deduction ? effectiveMark(manual.general[card], autoGeneral(deduction, me?.hand ?? [], card)).mark : "empty",
    [deduction, manual, me],
  );
}
