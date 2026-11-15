import type { LastResult } from "@mystery-game/contracts";
import { Trophy } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { EnvelopeCards } from "../cards/index.js";
import { lobbyMessages } from "./i18n.js";

type Props = { result: LastResult; myId: string };

/** Region "Last game": winner of the previous game in this room and the envelope. */
export function LastGame({ result, myId }: Props) {
  const t = useT(lobbyMessages);
  return (
    <section
      aria-label={t("last_game")}
      className="flex flex-col gap-3 rounded border border-brand bg-surface p-3"
    >
      <p className="m-0 text-xs font-bold tracking-wide text-muted uppercase">{t("last_game")}</p>
      <div className="flex items-center gap-2">
        <Trophy aria-hidden="true" className="size-6 shrink-0 text-brand-strong" />
        <h2 className="m-0 text-2xl font-bold text-brand-strong">
          {result.winnerId === myId ? t("you_win") : t("other_wins", { name: result.winnerName })}
        </h2>
      </div>
      {result.reason === "LAST_STANDING" ? (
        <p className="m-0 text-muted">{t("last_standing")}</p>
      ) : null}
      <EnvelopeCards envelope={result.envelope} caption={t("solution")} compact />
    </section>
  );
}
