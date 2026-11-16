import type { ComponentType } from "react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { DisprovePanel, SeenCards, SuggestionResult } from "../disprove/index.js";
import { RoomCardPeek } from "../room-cards/index.js";
import { TurnPanel, type Send } from "../turn/index.js";
import { useT } from "../../shared/i18n/index.js";
import { gameScreenMessages } from "./i18n.js";
import { attentionFor } from "./selectors.js";

export type ActionSlotProps = { game: PublicGameState; me: PrivateGameState; myId: string; send: Send };
export type ActionSlot = ComponentType<ActionSlotProps>;

/**
 * Everything the player acts on, rendered top to bottom.
 * HOT FILE: append-only list – add new slots at the end, remove only your own.
 */
export const actionSlots: readonly ActionSlot[] = [
  TurnPanel,
  DisprovePanel,
  SuggestionResult,
  SeenCards,
  RoomCardPeek,
];

type Props = ActionSlotProps & { timerUrgent?: boolean };

/**
 * Action section (region "Actions"). Sticky: on mobile it is a direct child of <main>
 * (top and bottom), on desktop it sticks to the top of the right column.
 * `data-attention` drives the attention / urgent styling in styles.css.
 */
export function ActionSection({ timerUrgent = false, ...props }: Props) {
  const t = useT(gameScreenMessages);
  return (
    <section
      aria-label={t("actions")}
      data-attention={attentionFor(props.me, timerUrgent)}
      className="action-section sticky top-0 bottom-0 z-20 flex flex-col gap-3 rounded border-2 border-line bg-surface p-3 shadow-raised lg:top-3"
    >
      {actionSlots.map((Slot, i) => (
        <Slot key={i} {...props} />
      ))}
    </section>
  );
}
