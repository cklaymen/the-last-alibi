import { Eye } from "lucide-react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { CardTile, cardMessages } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { disproveMessages } from "./i18n.js";
import { latestShownToMe } from "./selectors.js";

type Props = { game: PublicGameState; me: PrivateGameState };

/** Private: cards other players showed me, with the newest result highlighted. */
export function SeenCards({ game, me }: Props) {
  const t = useT(disproveMessages);
  const card = useT(cardMessages);
  const fresh = latestShownToMe(game, me);
  if (me.seenCards.length === 0) return null;

  return (
    <section aria-label={t("seenRegion")} className="flex flex-col gap-2">
      {fresh && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center gap-2 rounded border-2 border-brand-strong bg-surface-2 p-3 font-bold"
        >
          <Eye aria-hidden="true" className="size-5 text-brand-strong" />
          <span>{t("showedYou", { name: playerName(game, fresh.fromPlayerId), card: card(fresh.cardId) })}</span>
          <CardTile id={fresh.cardId} compact />
        </div>
      )}
      <h2 className="m-0 text-base font-bold">{t("seenRegion")}</h2>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {me.seenCards.map((s, i) => (
          <li key={`${i}-${s.cardId}`}>
            {t("seenItem", { card: card(s.cardId), name: playerName(game, s.fromPlayerId) })}
          </li>
        ))}
      </ul>
    </section>
  );
}
