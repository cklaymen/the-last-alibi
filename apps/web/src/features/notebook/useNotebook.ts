import { useEffect, useState } from "react";
import type { CardId } from "@mystery-game/game";
import { autoMark, cycle, loadNotebook, saveNotebook } from "./notebookModel.js";

/** Notebook persisted under `key`; `known` cards (hand + seen) are auto-marked "has". */
export function useNotebook(key: string, known: readonly CardId[]) {
  const [state, setState] = useState(() => autoMark(loadNotebook(key), known));
  const knownKey = known.join(",");

  useEffect(() => {
    setState((s) => autoMark(s, known));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- knownKey tracks `known`
  }, [knownKey]);

  useEffect(() => saveNotebook(key, state), [key, state]);

  return { state, toggle: (card: CardId) => setState((s) => cycle(s, card)) };
}
