import type { ActionId } from "@mystery-game/contracts";
import { EndTurnAction, PassageAction, RollAction } from "./components/basic.js";
import { AccuseAction, SuggestAction } from "./components/dialogs.js";
import type { TurnAction } from "./types.js";

/**
 * Registry of turn actions rendered as buttons, in display order. Adding an
 * action = adding an entry. "move" (board) and "disprove" (features/disprove)
 * are handled elsewhere and therefore not listed.
 */
export const turnActions: readonly TurnAction[] = [
  { id: "roll", Component: RollAction },
  { id: "passage", Component: PassageAction },
  { id: "suggest", Component: SuggestAction },
  { id: "accuse", Component: AccuseAction },
  { id: "end_turn", Component: EndTurnAction },
];

/** Registry entries the server currently allows, in registry order. */
export function visibleActions(
  available: readonly ActionId[],
  registry: readonly TurnAction[] = turnActions,
): TurnAction[] {
  return registry.filter((a) => available.includes(a.id));
}
