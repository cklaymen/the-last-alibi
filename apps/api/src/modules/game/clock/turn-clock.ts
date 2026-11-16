import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import type { Game, PlayState } from "@mystery-game/game";
import type { PublicGameState } from "@mystery-game/contracts";
import { TIMER, type Timer } from "../../presence/index.js";
import { CLOCK, type Clock } from "./clock.js";

export type TimerKind = "turn" | "disprove";
export type ExpireHandler = (kind: TimerKind, key: string) => void;
export interface TimeLimitsOverride {
  readonly turn?: number | undefined;
  readonly disprove?: number | undefined;
}

/** A countdown; `startedAt` null = paused with `remainingMs` left. */
interface Countdown {
  readonly key: string;
  readonly playerId: string;
  readonly durationMs: number;
  remainingMs: number;
  startedAt: number | null;
  cancel: (() => void) | null;
}

interface RoomTimers {
  /** Key of the turn the timers belong to (also when the turn has no limit). */
  turnKey: string;
  turn: Countdown | null;
  disprove: Countdown | null;
}

const TURN_START_EVENTS = new Set(["game_started", "turn_ended", "turn_skipped", "turn_timed_out"]);

function lastIndexWhere(play: PlayState, test: (type: string) => boolean): number {
  for (let i = play.events.length - 1; i >= 0; i--) if (test(play.events[i]!.type)) return i;
  return -1;
}

/** Identifies the current turn: a new key whenever a turn starts. */
export function turnKeyOf(game: Game, play: PlayState): string {
  return `${game.id}:${lastIndexWhere(play, (t) => TURN_START_EVENTS.has(t))}`;
}

const limitMs = (sec: number | null, override: number | undefined): number | null =>
  override ?? (sec === null ? null : sec * 1000);

/**
 * Turn and disprove countdowns per room. `sync` is called after every saved
 * change: it starts, pauses, resumes or cancels countdowns so they match the
 * game. The turn countdown is paused (not reset) while a disprove is pending.
 * Expired countdowns call `onExpire(kind, key)`; the caller re-checks
 * `isCurrent(key)` so stale expiries are ignored.
 */
@Injectable()
export class TurnClock implements OnModuleDestroy {
  private readonly rooms = new Map<string, RoomTimers>();
  private readonly overrides = new Map<string, TimeLimitsOverride>();

  public constructor(
    @Inject(TIMER) private readonly timer: Timer,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  public sync(game: Game, onExpire: ExpireHandler): void {
    const code = game.roomCode;
    const play = game.play;
    if (game.phase !== "IN_PROGRESS" || !play) {
      this.reset(code);
      return;
    }
    const override = this.overrides.get(code) ?? {};
    const turnKey = turnKeyOf(game, play);
    let state = this.rooms.get(code);
    if (!state || state.turnKey !== turnKey) {
      this.reset(code);
      const turnMs = limitMs(game.settings.turnTimeLimitSec, override.turn);
      state = {
        turnKey,
        turn: turnMs === null ? null : this.countdown(turnKey, play.turn.playerId, turnMs),
        disprove: null,
      };
      this.rooms.set(code, state);
    }

    const pending = play.turn.pendingSuggestion;
    if (pending) {
      if (state.turn) this.pause(state.turn);
      const disproveKey = `${turnKey}:${lastIndexWhere(play, (t) => t === "suggested")}`;
      if (state.disprove?.key !== disproveKey) {
        this.stop(state.disprove);
        const ms = limitMs(game.settings.disproveTimeLimitSec, override.disprove);
        state.disprove = ms === null ? null : this.countdown(disproveKey, pending.disproverId, ms);
        if (state.disprove) this.run(state.disprove, "disprove", onExpire);
      }
      return;
    }
    this.stop(state.disprove);
    state.disprove = null;
    if (state.turn && state.turn.startedAt === null) this.run(state.turn, "turn", onExpire);
  }

  /** The countdown players see: the disprove one while it runs, otherwise the turn one. */
  public view(roomCode: string): PublicGameState["timer"] {
    const state = this.rooms.get(roomCode);
    const countdown = state?.disprove ?? state?.turn;
    if (!countdown) return null;
    return {
      kind: state?.disprove ? "disprove" : "turn",
      playerId: countdown.playerId,
      remainingMs: this.remaining(countdown),
      durationMs: countdown.durationMs,
    };
  }

  public isCurrent(roomCode: string, key: string): boolean {
    const state = this.rooms.get(roomCode);
    if (!state) return false;
    if (state.disprove) return state.disprove.key === key;
    return state.turn?.key === key && state.turn.startedAt !== null;
  }

  /** Room deleted: cancels its countdowns and drops its test override. */
  public forget(roomCode: string): void {
    this.reset(roomCode);
    this.overrides.delete(roomCode);
  }

  /** Test API only: overrides the limits (ms) and restarts the countdowns on the next sync. */
  public setOverride(roomCode: string, ms: TimeLimitsOverride): void {
    const prev = this.overrides.get(roomCode);
    this.overrides.set(roomCode, {
      turn: ms.turn ?? prev?.turn,
      disprove: ms.disprove ?? prev?.disprove,
    });
    this.reset(roomCode);
  }

  /** Cancels the room's countdowns; the next sync starts fresh ones. */
  public reset(roomCode: string): void {
    const state = this.rooms.get(roomCode);
    if (!state) return;
    this.stop(state.turn);
    this.stop(state.disprove);
    this.rooms.delete(roomCode);
  }

  public onModuleDestroy(): void {
    for (const code of [...this.rooms.keys()]) this.reset(code);
    this.overrides.clear();
  }

  private countdown(key: string, playerId: string, durationMs: number): Countdown {
    return { key, playerId, durationMs, remainingMs: durationMs, startedAt: null, cancel: null };
  }

  private run(c: Countdown, kind: TimerKind, onExpire: ExpireHandler): void {
    c.startedAt = this.clock.now();
    c.cancel = this.timer.schedule(c.remainingMs, () => onExpire(kind, c.key));
  }

  private pause(c: Countdown): void {
    if (c.startedAt === null) return;
    c.remainingMs = this.remaining(c);
    c.startedAt = null;
    c.cancel?.();
    c.cancel = null;
  }

  private stop(c: Countdown | null): void {
    c?.cancel?.();
    if (c) c.cancel = null;
  }

  private remaining(c: Countdown): number {
    if (c.startedAt === null) return Math.max(0, Math.round(c.remainingMs));
    return Math.max(0, Math.round(c.remainingMs - (this.clock.now() - c.startedAt)));
  }
}
