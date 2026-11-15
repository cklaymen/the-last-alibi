import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { CardTile, cardMessages } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { CommandError, useCommand, type Send } from "../turn/index.js";
import { useT } from "../../shared/i18n/index.js";
import { disproveMessages } from "./i18n.js";

type Props = { game: PublicGameState; me: PrivateGameState; send: Send };

/** Shown only to the player who must show a card; no pass option. */
export function DisprovePanel({ game, me, send }: Props) {
  const t = useT(disproveMessages);
  const card = useT(cardMessages);
  const { run, busy, error } = useCommand(send);
  const request = me.disproveRequest;
  if (!request) return null;
  const suggester = playerName(game, request.suggesterId);
  const { suspect, weapon, room } = request.suggestion;

  return (
    <section
      aria-label={t("region")}
      className="flex flex-col gap-3 rounded border-2 border-brand-strong bg-surface p-3"
    >
      <h2 className="m-0 text-base font-bold">{t("prompt", { name: suggester })}</h2>
      <p className="m-0 text-sm text-muted">
        {t("hint", { name: suggester, suspect: card(suspect), weapon: card(weapon), room: card(room) })}
      </p>
      <div className="flex flex-wrap gap-2">
        {request.matchingCards.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={card(id)}
            disabled={busy}
            onClick={() => void run("turn:disprove", { cardId: id })}
            className="rounded p-0 disabled:opacity-50"
          >
            <CardTile id={id} />
          </button>
        ))}
      </div>
      <CommandError message={error} />
    </section>
  );
}
