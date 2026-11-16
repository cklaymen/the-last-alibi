import { useCallback, useContext, useEffect } from "react";
import type { CardId } from "@mystery-game/game";
import { GameContext } from "../game/index.js";
import { autoMark, cycle, markOf, notebookKey, type Mark } from "./notebookModel.js";
import { updateNotebook, useNotebookState } from "./notebookStore.js";

/** Notebook persisted under `key`; `known` cards (hand + seen) are auto-marked "has". */
export function useNotebook(key: string, known: readonly CardId[]) {
  const state = useNotebookState(key);
  const knownKey = known.join(",");

  useEffect(() => {
    updateNotebook(key, (s) => autoMark(s, known));
    // Deliberately keyed by `knownKey` (a stable string) instead of the `known` array.
  }, [key, knownKey]);

  const toggle = useCallback((card: CardId) => updateNotebook(key, (s) => cycle(s, card)), [key]);
  return { state, toggle };
}

/**
 * Read-only view of my notebook for the current game, kept in sync with the
 * Notebook component. Returns a lookup `(cardId) => mark` (all "empty" outside a game).
 */
export function useNotebookMarks(): (card: CardId) => Mark {
  const ctx = useContext(GameContext);
  const state = useNotebookState(ctx?.game ? notebookKey(ctx.game.gameId, ctx.myId) : null);
  return useCallback((card: CardId) => markOf(state, card), [state]);
}
