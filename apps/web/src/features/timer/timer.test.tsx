import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { makeGame, makeMe } from "../game/testFixtures.js";
import { ActionSection } from "../game/ActionSection.js";
import { TimerBar } from "./TimerBar.js";
import { isUrgent, useCountdown, type Countdown } from "./useCountdown.js";
import type { PublicGameState } from "@mystery-game/contracts";

type Timer = PublicGameState["timer"];
const turnTimer = (remainingMs: number, playerId = "p1"): Timer => ({
  kind: "turn",
  playerId,
  remainingMs,
  durationMs: 90_000,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useCountdown", () => {
  it("counts down from remainingMs", () => {
    const { result } = renderHook(({ t }) => useCountdown(t), { initialProps: { t: turnTimer(45_000) } });
    expect(result.current?.leftMs).toBe(45_000);
    expect(result.current?.fraction).toBe(0.5);
    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current?.leftMs).toBe(40_000);
  });

  it("resets when a new timer object arrives", () => {
    const { result, rerender } = renderHook(({ t }: { t: Timer }) => useCountdown(t), {
      initialProps: { t: turnTimer(45_000) },
    });
    act(() => vi.advanceTimersByTime(10_000));
    rerender({ t: turnTimer(80_000) });
    expect((result.current as Countdown).leftMs).toBe(80_000);
  });

  it("null timer gives null and never goes below 0", () => {
    const { result, rerender } = renderHook(({ t }: { t: Timer }) => useCountdown(t), {
      initialProps: { t: null as Timer },
    });
    expect(result.current).toBeNull();
    rerender({ t: turnTimer(1_000) });
    act(() => vi.advanceTimersByTime(5_000));
    expect(result.current?.leftMs).toBe(0);
  });

  it("urgent at 10 s", () => {
    expect(isUrgent(10_000)).toBe(true);
    expect(isUrgent(10_001)).toBe(false);
  });
});

describe("TimerBar", () => {
  it("null timer renders nothing", () => {
    render(<TimerBar game={makeGame({ timer: null })} />);
    expect(screen.queryByRole("timer")).toBeNull();
  });

  it("names the player and the seconds left", () => {
    render(<TimerBar game={makeGame({ timer: turnTimer(30_000) })} />);
    expect(screen.getByRole("timer").getAttribute("aria-label")).toMatch(/^Time left for .+: 30 s$/);
  });
});

describe("ActionSection urgency", () => {
  const me = makeMe({ availableActions: ["end_turn"] });
  const section = () => screen.getByRole("region", { name: "Actions" });

  it('data-attention="urgent" for my timer in the last 10 s', () => {
    render(<ActionSection game={makeGame({ timer: turnTimer(15_000) })} me={me} myId="p1" send={vi.fn()} />);
    expect(section()).toHaveAttribute("data-attention", "action");
    act(() => vi.advanceTimersByTime(5_000));
    expect(section()).toHaveAttribute("data-attention", "urgent");
  });

  it("another player's timer is not urgent for me", () => {
    render(<ActionSection game={makeGame({ timer: turnTimer(5_000, "p2") })} me={me} myId="p1" send={vi.fn()} />);
    expect(section()).toHaveAttribute("data-attention", "action");
  });
});
