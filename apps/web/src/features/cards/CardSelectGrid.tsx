import type { CardId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { CardHint, type CardAnnotation } from "./CardHint.js";
import { CardTile } from "./CardTile.js";
import { cardMessages } from "./i18n.js";

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
            {note && <CardHint note={note} />}
          </button>
        );
      })}
    </div>
  );
}
