import { Moon, WifiOff, X } from "lucide-react";
import type { PublicGameState } from "@mystery-game/contracts";
import { CharacterAvatar, cardMessages } from "../cards/index.js";
import { useLocale, useT } from "../../shared/i18n/index.js";
import { playersMessages } from "./i18n.js";
import { orderedPlayers, pluralCategory } from "./selectors.js";

type Props = { game: PublicGameState; myId: string };

/**
 * Compact chips of all players in turn order (fits next to the map controls).
 * Badges on the avatar show card count, presence and elimination; the full
 * info is in each chip's accessible name. The active one has aria-current.
 */
export function PlayersBar({ game, myId }: Props) {
  const t = useT(playersMessages);
  const card = useT(cardMessages);
  const locale = useLocale();
  return (
    <section aria-label={t("region")} className="min-w-0">
      <ul className="-mx-1 my-0 flex list-none gap-1.5 overflow-x-auto p-1">
        {orderedPlayers(game).map((p) => {
          const active =
            game.turn.playerId === p.id && game.status === "IN_PROGRESS";
          const cards = t(`cards_${pluralCategory(p.cardCount, locale)}`, {
            count: p.cardCount,
          });
          const label = [
            p.id === myId ? `${p.name} ${t("you")}` : p.name,
            card(p.characterId),
            cards,
            p.presence !== "online" ? t(p.presence) : null,
            p.eliminated ? t("eliminated") : null,
          ]
            .filter(Boolean)
            .join(" – ");
          return (
            <li
              key={p.id}
              aria-label={label}
              aria-current={active ? "true" : undefined}
              title={label}
              className={`flex max-w-32 shrink-0 items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 ${
                active
                  ? "border-brand-strong bg-surface-2 ring-2 ring-brand-strong"
                  : "border-line bg-surface"
              } ${p.eliminated ? "opacity-60" : ""}`}
            >
              <span
                aria-hidden="true"
                className="relative inline-flex shrink-0"
              >
                <span
                  className={`inline-flex ${p.presence !== "online" ? "opacity-40 grayscale" : ""}`}
                >
                  <CharacterAvatar id={p.characterId} size={28} />
                </span>
                <span className="absolute -right-1 -bottom-1 min-w-4 rounded-full border border-line bg-surface px-0.5 text-center text-[10px] leading-4 font-bold">
                  {p.cardCount}
                </span>
                {p.presence !== "online" && (
                  <PresenceBadge presence={p.presence} />
                )}
                {p.eliminated && (
                  <X
                    className="absolute -top-1 -left-1 size-4 rounded-full bg-danger p-0.5 text-surface"
                    strokeWidth={3}
                  />
                )}
              </span>
              <span
                aria-hidden="true"
                className={`truncate text-sm font-bold ${p.eliminated ? "line-through" : ""}`}
              >
                {p.name}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PresenceBadge({ presence }: { presence: "offline" | "away" }) {
  const Icon = presence === "away" ? Moon : WifiOff;
  return (
    <Icon
      className="absolute -top-1 -right-1 size-4 rounded-full bg-surface p-0.5 text-muted"
      strokeWidth={2.5}
    />
  );
}
