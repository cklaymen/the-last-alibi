import { Hand } from "lucide-react";
import type { CardId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { CardTile } from "./CardTile.js";
import { cardMessages } from "./i18n.js";

/** Notebook mark of a card (same values as the notebook feature). */
export type CardMark = "empty" | "has" | "not" | "maybe";
export type CardAnnotation = { inHand: boolean; mark: CardMark };

const markSymbol: Record<CardMark, string> = { empty: "", has: "✓", not: "✗", maybe: "?" };
const markTone: Record<CardMark, string> = {
  empty: "",
  has: "text-brand-strong",
  not: "text-danger",
  maybe: "text-fg",
};

type Props<T extends CardId> = {
  /** Accessible name of the radiogroup, e.g. "Suspect". */
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (id: T) => void;
  /** Optional per-card hints (in my hand / notebook mark) shown on each option. */
  annotate?: (id: T) => CardAnnotation;
  /** Locks the choice (e.g. a room fixed by the house rules). */
  disabled?: boolean;
};

/** Single-choice grid of cards (role="radiogroup" / role="radio", named by the card). */
export function CardSelectGrid<T extends CardId>({
  label,
  options,
  value,
  onChange,
  annotate,
  disabled = false,
}: Props<T>) {
  const t = useT(cardMessages);
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((id) => {
        const note = annotate?.(id);
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            disabled={disabled}
            aria-label={t(id)}
            onClick={() => onChange(id)}
            className={`flex flex-col gap-1 rounded p-0 text-left ${
              value === id ? "outline-2 outline-brand" : ""
            } ${disabled && value !== id ? "opacity-50" : ""}`}
          >
            <CardTile id={id} compact />
            {note && (note.inHand || note.mark !== "empty") ? (
              <span className="flex min-h-5 items-center justify-between gap-1 px-1 text-xs">
                {note.inHand ? (
                  <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-bold text-brand-strong">
                    <Hand aria-hidden="true" className="size-3.5 shrink-0" />
                    {t("in_hand")}
                  </span>
                ) : (
                  <span />
                )}
                {note.mark !== "empty" ? (
                  <span
                    title={t("notebook_mark", { state: t(`mark_${note.mark}`) })}
                    className={`font-bold ${markTone[note.mark]}`}
                  >
                    <span aria-hidden="true">{markSymbol[note.mark]}</span>
                    <span className="sr-only">
                      {t("notebook_mark", { state: t(`mark_${note.mark}`) })}
                    </span>
                  </span>
                ) : null}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
