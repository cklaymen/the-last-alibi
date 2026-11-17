import { useEffect, useRef } from "react";
import type { GameEvent, PublicGameState } from "@mystery-game/contracts";
import type { CardId } from "@mystery-game/game";
import { CardIcon, cardMessages } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { describeEvent } from "./describe.js";
import { eventLogMessages } from "./i18n.js";

/** Cards named by a suggestion / accusation entry (shown as icons before the sentence). */
function triple(event: GameEvent): CardId[] | null {
  const t = event.type === "suggested" ? event.suggestion : event.type === "accused" ? event.accusation : null;
  return t ? [t.suspect, t.weapon, t.room] : null;
}

/**
 * Public event log, oldest first; scrolls to the newest entry.
 * The visible heading comes from the surrounding `Collapsible` on the game screen.
 */
export function EventLog({ game }: { game: PublicGameState }) {
  const t = useT(eventLogMessages);
  const card = useT(cardMessages);
  const scroller = useRef<HTMLDivElement>(null);
  const count = game.events.length;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  const ctx = { name: (id: string) => playerName(game, id), card: (id: Parameters<typeof card>[0]) => card(id) };

  return (
    <section aria-label={t("region")} className="flex min-h-0 flex-col gap-2">
      <div ref={scroller} className="max-h-64 overflow-y-auto rounded border border-line bg-surface lg:max-h-72">
        {count === 0 ? (
          <p className="m-0 p-3 text-sm text-muted">{t("empty")}</p>
        ) : (
          <ol className="m-0 flex list-none flex-col p-0 text-sm">
            {game.events.map(({ seq, event }) => {
              const { key, params } = describeEvent(event, ctx);
              const cards = triple(event);
              return (
                <li key={seq} className="flex items-start gap-2 border-b border-line px-3 py-2 last:border-b-0">
                  {cards && (
                    <span aria-hidden="true" className="flex shrink-0 items-center gap-0.5 pt-0.5">
                      {cards.map((id) => (
                        <CardIcon key={id} id={id} size={16} />
                      ))}
                    </span>
                  )}
                  <span className="min-w-0">{t(key, params)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
