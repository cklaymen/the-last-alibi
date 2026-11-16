import { useEffect, useRef } from "react";
import type { PublicGameState } from "@mystery-game/contracts";
import { cardMessages } from "../cards/index.js";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { describeEvent } from "./describe.js";
import { eventLogMessages } from "./i18n.js";

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
              return (
                <li key={seq} className="border-b border-line px-3 py-2 last:border-b-0">
                  {t(key, params)}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
