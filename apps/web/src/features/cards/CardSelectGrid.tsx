import type { CardId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { CardTile } from "./CardTile.js";
import { cardMessages } from "./i18n.js";

type Props<T extends CardId> = {
  /** Accessible name of the radiogroup, e.g. "Suspect". */
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (id: T) => void;
};

/** Single-choice grid of cards (role="radiogroup" / role="radio"). */
export function CardSelectGrid<T extends CardId>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  const t = useT(cardMessages);
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-label={t(id)}
          onClick={() => onChange(id)}
          className={`rounded p-0 text-left ${
            value === id ? "outline-2 outline-brand" : ""
          }`}
        >
          <CardTile id={id} compact />
        </button>
      ))}
    </div>
  );
}
