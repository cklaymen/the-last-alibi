import type { Triple } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { CardTile } from "./CardTile.js";
import { cardMessages } from "./i18n.js";

type Props = {
  envelope: Triple;
  /** Visible caption above the cards; defaults to "Envelope". */
  caption?: string;
  compact?: boolean;
};

/** Region "Envelope" with the three solution cards. */
export function EnvelopeCards({ envelope, caption, compact = false }: Props) {
  const t = useT(cardMessages);
  return (
    <section aria-label={t("envelope")} className="flex flex-col gap-2">
      <h3 className="m-0 text-sm font-bold text-muted">{caption ?? t("envelope")}</h3>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 min-[400px]:grid-cols-3">
        {[envelope.suspect, envelope.weapon, envelope.room].map((card) => (
          <li key={card} className="min-w-0">
            <CardTile id={card} compact={compact} />
          </li>
        ))}
      </ul>
    </section>
  );
}
