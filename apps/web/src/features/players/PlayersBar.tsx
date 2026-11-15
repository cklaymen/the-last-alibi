import { Moon, WifiOff } from "lucide-react";
import type { PublicGameState } from "@mystery-game/contracts";
import { CharacterAvatar } from "../cards/index.js";
import { useLocale, useT } from "../../shared/i18n/index.js";
import { playersMessages } from "./i18n.js";
import { orderedPlayers, pluralCategory } from "./selectors.js";

type Props = { game: PublicGameState; myId: string };

/** All players in turn order; the active one is marked with aria-current. */
export function PlayersBar({ game, myId }: Props) {
  const t = useT(playersMessages);
  const locale = useLocale();
  return (
    <section aria-label={t("region")} className="min-w-0">
      <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
        {orderedPlayers(game).map((p) => {
          const active = game.turn.playerId === p.id && game.status === "IN_PROGRESS";
          return (
            <li
              key={p.id}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded border px-3 py-1.5 ${
                active ? "border-brand-strong bg-surface-2" : "border-line bg-surface"
              } ${p.eliminated ? "opacity-60" : ""}`}
            >
              <span className={`inline-flex shrink-0 ${p.presence !== "online" ? "opacity-40 grayscale" : ""}`}>
                <CharacterAvatar id={p.characterId} size={28} />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className={`truncate font-bold ${p.eliminated ? "line-through" : ""}`}>
                  {p.name}
                  {p.id === myId && <span className="ml-1 font-normal text-muted">{t("you")}</span>}
                </span>
                <span className="text-xs text-muted">
                  {t(`cards_${pluralCategory(p.cardCount, locale)}`, { count: p.cardCount })}
                  {p.eliminated && (
                    <span className="ml-2 font-bold uppercase text-danger">{t("out")}</span>
                  )}
                  {p.presence !== "online" && <PresenceBadge presence={p.presence} />}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PresenceBadge({ presence }: { presence: "offline" | "away" }) {
  const t = useT(playersMessages);
  const Icon = presence === "away" ? Moon : WifiOff;
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 align-middle font-bold text-muted">
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {t(presence)}
    </span>
  );
}
