import type { CardId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { CardIcon, cardMessages } from "../cards/index.js";
import { notebookMessages } from "./i18n.js";
import { markSymbol as symbol, type Mark } from "./notebookModel.js";

const tone: Record<Mark, string> = {
  empty: "text-muted",
  has: "text-brand-strong",
  not: "text-danger",
  maybe: "text-fg",
};

type Props = { card: CardId; mark: Mark; onToggle: (card: CardId) => void };

export function NotebookCell({ card, mark, onToggle }: Props) {
  const t = useT(notebookMessages);
  const tc = useT(cardMessages);
  return (
    <li>
      <button
        type="button"
        aria-label={t("cell", { card: tc(card), state: t(mark) })}
        onClick={() => onToggle(card)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded border border-line bg-surface px-2 text-left text-sm text-fg hover:bg-surface-2"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CardIcon id={card} size={18} />
          <span className={`truncate ${mark === "not" ? "text-muted line-through" : ""}`}>
            {tc(card)}
          </span>
        </span>
        <span aria-hidden="true" className={`w-4 shrink-0 text-center font-bold ${tone[mark]}`}>
          {symbol[mark]}
        </span>
      </button>
    </li>
  );
}
