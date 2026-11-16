import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { cardMessages } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { disproveMessages } from "./i18n.js";

type Props = { game: PublicGameState; me: PrivateGameState };

/** Private: cards other players showed me. The fresh result is shown by SuggestionResult. */
export function SeenCards({ game, me }: Props) {
  const t = useT(disproveMessages);
  const card = useT(cardMessages);
  if (me.seenCards.length === 0) return null;

  return (
    <section aria-label={t("seenRegion")} className="flex flex-col gap-2">
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
