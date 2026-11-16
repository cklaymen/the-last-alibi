import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CardId, PublicGameState, Scenario } from "@mystery-game/contracts";
import {
  endTurn,
  playerId as toPlayerId,
  type Game,
  type PlayerId,
} from "@mystery-game/game";
import { TurnClock } from "../src/modules/game/index.js";
import {
  applyScenario,
  createRoom,
  FakeTime,
  settle,
  startApp,
  startedRoom,
  waitFor,
  type Client,
  type TestApp,
} from "./helpers.js";

const ENVELOPE = { suspect: "green", weapon: "rope", room: "study" } as const;
const HANDS: Record<string, CardId[]> = {
  Alice: ["red", "yellow", "candlestick", "kitchen", "ballroom", "conservatory"],
  Bob: ["white", "dagger", "lead_pipe", "dining_room", "billiard_room", "library"],
  Carol: ["blue", "purple", "revolver", "wrench", "lounge", "hall"],
};
const scenario: Scenario = {
  envelope: ENVELOPE,
  hands: HANDS,
  pawns: { red: { kind: "room", roomId: "kitchen" } },
  summonedTo: { Alice: "kitchen" },
  activePlayer: "Alice",
};

let time: FakeTime;
let app: TestApp;
let open: Client[] = [];
beforeEach(async () => {
  time = new FakeTime();
  app = await startApp({ time, graceMs: 24 * 3600_000 });
});
afterEach(async () => {
  for (const c of open) c.socket.disconnect();
  open = [];
  await app.close();
});

async function threePlayers(): Promise<{ code: string; alice: Client; bob: Client; carol: Client }> {
  const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
  open.push(...clients);
  await applyScenario(app, code, scenario);
  const [alice, bob, carol] = clients as [Client, Client, Client];
  return { code, alice, bob, carol };
}

const timerOf = (c: Client): PublicGameState["timer"] | undefined => c.lastPublic()?.timer;
const activeOf = (c: Client): string | undefined => c.lastPublic()?.turn.playerId;

/** Advances fake time and lets the resulting broadcasts arrive. */
async function advance(ms: number): Promise<void> {
  time.advance(ms);
  await settle();
}

describe("turn time limit", () => {
  it("game:state.timer has kind, playerId, remainingMs, durationMs", async () => {
    const { alice, carol } = await threePlayers();
    expect(timerOf(carol)).toEqual({
      kind: "turn",
      playerId: alice.playerId,
      remainingMs: 90_000,
      durationMs: 90_000,
    });
  });

  it("turn ends after the limit", async () => {
    const { alice, bob, carol } = await threePlayers();
    await advance(89_999);
    expect(activeOf(carol)).toBe(alice.playerId);
    await advance(1);
    await waitFor(() => activeOf(carol) === bob.playerId);
    expect(carol.lastPublic()!.events.at(-1)?.event).toEqual({
      type: "turn_timed_out",
      playerId: alice.playerId,
    });
    expect(timerOf(carol)).toEqual({
      kind: "turn",
      playerId: bob.playerId,
      remainingMs: 90_000,
      durationMs: 90_000,
    });
  });

  it("no timer when limit is None", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    open.push(...clients);
    const [alice, bob] = clients as [Client, Client];
    await alice.send("room:choose_character", { characterId: "red" });
    await bob.send("room:choose_character", { characterId: "yellow" });
    expect(
      await alice.send("room:settings", { turnTimeLimitSec: null, disproveTimeLimitSec: null }),
    ).toEqual({ ok: true });
    expect(await alice.send("room:start")).toEqual({ ok: true });
    await waitFor(() => bob.lastPublic() !== undefined);
    expect(timerOf(bob)).toBeNull();
    const first = activeOf(bob);
    await advance(10 * 60_000);
    expect(activeOf(bob)).toBe(first);
    expect(time.pending()).toBe(0);
  });

  it("turn timer pauses during disprove and resumes with remaining time", async () => {
    const { alice, bob, carol } = await threePlayers();
    await advance(40_000);
    expect(await alice.send("turn:suggest", { suspect: "white", weapon: "dagger" })).toEqual({ ok: true });
    await waitFor(() => timerOf(carol)?.kind === "disprove");
    expect(timerOf(carol)).toEqual({
      kind: "disprove",
      playerId: bob.playerId,
      remainingMs: 30_000,
      durationMs: 30_000,
    });
    await advance(10_000);
    expect(await bob.send("turn:disprove", { cardId: "dagger" })).toEqual({ ok: true });
    await waitFor(() => timerOf(carol)?.kind === "turn");
    expect(timerOf(carol)).toEqual({
      kind: "turn",
      playerId: alice.playerId,
      remainingMs: 50_000,
      durationMs: 90_000,
    });
    await advance(49_999);
    expect(activeOf(carol)).toBe(alice.playerId);
    await advance(1);
    await waitFor(() => activeOf(carol) === bob.playerId);
  });

  it("disprove timeout shows a random card to the suggester only", async () => {
    const { alice, bob, carol } = await threePlayers();
    expect(await alice.send("turn:suggest", { suspect: "white", weapon: "dagger" })).toEqual({ ok: true });
    await waitFor(() => timerOf(carol)?.kind === "disprove");
    await advance(30_000);
    await waitFor(() => alice.lastPrivate()!.seenCards.length === 1);
    const shown = alice.lastPrivate()!.seenCards[0]!;
    expect(shown.fromPlayerId).toBe(bob.playerId);
    expect(["white", "dagger"]).toContain(shown.cardId);
    expect(carol.lastPrivate()!.seenCards).toEqual([]);
    expect(bob.lastPrivate()!.seenCards).toEqual([]);
    expect(carol.lastPublic()!.events.slice(-2).map((e) => e.event)).toEqual([
      { type: "disprove_timed_out", playerId: bob.playerId },
      { type: "card_shown", playerId: bob.playerId, toPlayerId: alice.playerId },
    ]);
    // Nothing Carol received names the shown card outside the public suggestion.
    for (const e of carol.events) {
      if (e.event === "game:private") expect(JSON.stringify(e.payload.seenCards)).toBe("[]");
    }
    expect(timerOf(carol)).toEqual({
      kind: "turn",
      playerId: alice.playerId,
      remainingMs: 90_000,
      durationMs: 90_000,
    });
  });

  it("stale timeout is ignored (turn ended manually before expiry)", async () => {
    const { alice, bob, carol } = await threePlayers();
    await advance(10_000);
    expect(await alice.send("turn:end")).toEqual({ ok: true });
    await waitFor(() => activeOf(carol) === bob.playerId);
    // Alice's original deadline (90 s) passes; Bob's turn started at 10 s.
    await advance(80_000);
    expect(activeOf(carol)).toBe(bob.playerId);
    expect(carol.lastPublic()!.events.some((e) => e.event.type === "turn_timed_out")).toBe(false);
    await advance(10_000);
    await waitFor(() => activeOf(carol) === carol.playerId);
  });

  it("timer cleared when the game finishes", async () => {
    const { alice, carol } = await threePlayers();
    expect(await alice.send("turn:accuse", ENVELOPE)).toEqual({ ok: true });
    await waitFor(() => carol.lastRoom()?.phase === "LOBBY");
    expect(time.pending()).toBe(0);
    await advance(10 * 60_000);
    expect(carol.lastRoom()?.phase).toBe("LOBBY");
  });

  it("test API timeLimitsMs overrides the limits", async () => {
    const { code, alice, carol } = await threePlayers();
    await applyScenario(app, code, { timeLimitsMs: { turn: 2_000, disprove: 1_000 } });
    expect(timerOf(carol)).toEqual({
      kind: "turn",
      playerId: alice.playerId,
      remainingMs: 2_000,
      durationMs: 2_000,
    });
  });
});

describe("TurnClock", () => {
  const ALICE = toPlayerId("a");
  const BOB = toPlayerId("b");
  const game = (): Game =>
    ({
      id: "g1",
      roomCode: "ROOM",
      hostId: ALICE,
      maxPlayers: 6,
      phase: "IN_PROGRESS",
      players: [
        { id: ALICE, name: "A", characterId: "red" },
        { id: BOB, name: "B", characterId: "yellow" },
      ],
      lastResult: null,
      settings: {
        accusationPlace: "any_room",
        accuseAfterSuggestion: true,
        suggestAfterStaying: false,
        turnTimeLimitSec: 30,
        disproveTimeLimitSec: 15,
        roomCards: 0,
        autoNotes: true,
      },
      play: {
        turnOrder: [ALICE, BOB],
        turn: {
          playerId: ALICE,
          dice: null,
          hasMoved: false,
          leftRoom: null,
          suggestionRoom: null,
          hasSuggested: false,
          pendingSuggestion: null,
        },
        pawns: {} as never,
        weapons: {} as never,
        envelope: ENVELOPE,
        hands: {},
        eliminated: [],
        summonedTo: {},
        reveals: [],
        roomCards: {},
        events: [{ type: "game_started", firstPlayerId: ALICE }],
        winner: null,
      },
    }) as unknown as Game;

  it("a stale key is not current once the turn changed", () => {
    const t = new FakeTime();
    const clock = new TurnClock(t, t);
    const expired: string[] = [];
    const g1 = game();
    clock.sync(g1, (_k, key) => expired.push(key));
    t.advance(30_000);
    expect(expired).toHaveLength(1);
    const staleKey = expired[0]!;
    expect(clock.isCurrent("ROOM", staleKey)).toBe(true);
    const r = endTurn(g1, ALICE as PlayerId);
    if (!r.ok) throw new Error(r.code);
    clock.sync(r.game, () => undefined);
    expect(clock.isCurrent("ROOM", staleKey)).toBe(false);
  });

  it("forget (room deleted) cancels the countdowns", () => {
    const t = new FakeTime();
    const clock = new TurnClock(t, t);
    let fired = 0;
    clock.sync(game(), () => fired++);
    expect(t.pending()).toBe(1);
    clock.forget("ROOM");
    expect(t.pending()).toBe(0);
    expect(clock.view("ROOM")).toBeNull();
    t.advance(60_000);
    expect(fired).toBe(0);
  });

  it("not in progress cancels the countdowns", () => {
    const t = new FakeTime();
    const clock = new TurnClock(t, t);
    clock.sync(game(), () => undefined);
    clock.sync({ ...game(), phase: "LOBBY", play: null }, () => undefined);
    expect(t.pending()).toBe(0);
    expect(clock.view("ROOM")).toBeNull();
  });
});
