import { useEffect, useState } from "react";
import type { PublicGameState } from "@mystery-game/contracts";

export type GameTimer = PublicGameState["timer"];
export interface Countdown {
  leftMs: number;
  /** Remaining share of the full duration, 0..1. */
  fraction: number;
}

/** The last seconds of a timer are highlighted as urgent. */
export const URGENT_MS = 10_000;
export const isUrgent = (leftMs: number): boolean => leftMs <= URGENT_MS;

const TICK_MS = 250;

/**
 * Local countdown for the server's timer. The deadline is captured when a new
 * timer object arrives (every game:state push), so the server stays authoritative.
 */
export function useCountdown(timer: GameTimer): Countdown | null {
  const [now, setNow] = useState(() => Date.now());
  const [deadline, setDeadline] = useState<number | null>(null);

  useEffect(() => {
    if (!timer) {
      setDeadline(null);
      return;
    }
    const start = Date.now();
    setNow(start);
    setDeadline(start + timer.remainingMs);
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer || deadline === null) return null;
  const leftMs = Math.max(0, deadline - now);
  return { leftMs, fraction: timer.durationMs > 0 ? Math.min(1, leftMs / timer.durationMs) : 0 };
}
