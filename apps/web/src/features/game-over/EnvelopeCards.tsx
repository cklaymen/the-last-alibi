import type { Triple } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { CardTile } from "../cards/index.js";
import { gameOverMessages } from "./i18n.js";

export function EnvelopeCards({ envelope }: { envelope: Triple }) {
  const t = useT(gameOverMessages);
  return (
    <section aria-label={t("envelope")} className="flex flex-col gap-2">
      <p className="m-0 text-muted">{t("solution")}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {[envelope.suspect, envelope.weapon, envelope.room].map((card) => (
          <li key={card}>
            <CardTile id={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
