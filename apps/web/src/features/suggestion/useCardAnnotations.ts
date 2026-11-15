import { useCallback, useContext } from "react";
import type { CardId } from "@mystery-game/game";
import type { CardAnnotation } from "../cards/index.js";
import { GameContext } from "../game/index.js";
import { useNotebookMarks } from "../notebook/index.js";

/** Per-card hints for the card pickers: in my hand + my live notebook mark. */
export function useCardAnnotations(): (id: CardId) => CardAnnotation {
  const hand = useContext(GameContext)?.me?.hand;
  const markOf = useNotebookMarks();
  return useCallback(
    (id: CardId) => ({ inHand: hand?.includes(id) ?? false, mark: markOf(id) }),
    [hand, markOf],
  );
}
