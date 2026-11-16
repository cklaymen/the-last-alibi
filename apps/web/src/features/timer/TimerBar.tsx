import type { PublicGameState } from "@mystery-game/contracts";
import { playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { timerMessages } from "./i18n.js";
import { isUrgent, useCountdown } from "./useCountdown.js";

type Props = { game: PublicGameState };

/** Turn / disprove countdown bar, visible to every player. */
export function TimerBar({ game }: Props) {
  const t = useT(timerMessages);
  const countdown = useCountdown(game.timer);
  if (!game.timer || !countdown) return null;
  const seconds = Math.ceil(countdown.leftMs / 1000);
  const urgent = isUrgent(countdown.leftMs);
  return (
    <div
      role="timer"
      aria-label={t("label", { name: playerName(game, game.timer.playerId), seconds })}
      data-urgent={urgent}
      className="flex items-center gap-2 text-sm"
    >
      <div className="h-2 flex-1 overflow-hidden rounded bg-surface-2">
        <div
          className={`h-full rounded ${urgent ? "bg-urgent" : "bg-brand"}`}
          style={{ width: `${countdown.fraction * 100}%` }}
        />
      </div>
      <span aria-hidden="true" className={`tabular-nums ${urgent ? "font-bold text-urgent" : "text-muted"}`}>
        {seconds} s
      </span>
    </div>
  );
}
