import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { CardTile } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { disproveMessages } from "./i18n.js";
import { suggestionOutcome } from "./selectors.js";

type Props = { game: PublicGameState; me: PrivateGameState };

/**
 * Result of the current turn's suggestion, visible to everyone until the turn ends.
 * Only the suggester sees the shown card. The waiting state is shown by TurnPanel.
 */
export function SuggestionResult({ game, me }: Props) {
  const t = useT(disproveMessages);
  const outcome = suggestionOutcome(game, me);
  if (!outcome || outcome.kind === "pending") return null;
  const mine = outcome.suggesterId === me.playerId;
  const name = playerName(game, outcome.suggesterId);

  let content: ReactNode;
  if (outcome.kind === "none") {
    content = <span>{mine ? t("nobodyDisprovedYou") : t("nobodyDisproved", { name })}</span>;
  } else if (outcome.cardId) {
    content = (
      <>
        <span>{t("showedYouCard", { name: playerName(game, outcome.byId) })}</span>
        <CardTile id={outcome.cardId} compact />
      </>
    );
  } else {
    content = <span>{t("showedCardTo", { by: playerName(game, outcome.byId), name })}</span>;
  }

  return (
    <section
      aria-label={t("resultRegion")}
      aria-live="polite"
      className="flex flex-wrap items-center gap-2 rounded border-2 border-brand-strong bg-surface-2 p-3 font-bold"
    >
      <Eye aria-hidden="true" className="size-5 text-brand-strong" />
      {content}
    </section>
  );
}
