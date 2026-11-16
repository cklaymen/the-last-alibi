import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { CardId, Scenario } from "@mystery-game/contracts";
import {
  applyScenario,
  connectClient,
  createRoom,
  settle,
  startApp,
  startedRoom,
  waitFor,
  type Client,
  type RecordedEvent,
  type TestApp,
} from "./helpers.js";

let app: TestApp;
let open: Client[] = [];
beforeAll(async () => {
  app = await startApp();
});
afterEach(() => {
  for (const c of open) c.socket.disconnect();
  open = [];
});
afterAll(async () => {
  await app.close();
});

const track = (clients: Client[]): Client[] => {
  open.push(...clients);
  return clients;
};

const ENVELOPE = { suspect: "green", weapon: "rope", room: "study" } as const;
const HANDS: Record<string, CardId[]> = {
  Alice: ["red", "yellow", "candlestick", "kitchen", "ballroom", "conservatory"],
  Bob: ["white", "dagger", "lead_pipe", "dining_room", "billiard_room", "library"],
  Carol: ["blue", "purple", "revolver", "wrench", "lounge", "hall"],
};
const suggestionScenario: Scenario = {
  envelope: ENVELOPE,
  hands: HANDS,
  pawns: { red: { kind: "room", roomId: "kitchen" } },
  summonedTo: { Alice: "kitchen" },
  activePlayer: "Alice",
};

describe("starting a game", () => {
  it("only the host can start", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    track(clients);
    await clients[0]!.send("room:choose_character", { characterId: "red" });
    await clients[1]!.send("room:choose_character", { characterId: "yellow" });
    expect(await clients[1]!.send("room:start")).toEqual({ ok: false, code: "NOT_HOST" });
  });

  it.each([2, 3, 4, 5, 6])("deals a private hand to each of %i players", async (n) => {
    const names = Array.from({ length: n }, (_, i) => `Player${i}`);
    const { clients } = await startedRoom(app, names);
    track(clients);
    const hands = clients.map((c) => c.lastPrivate()!.hand);
    const sizes = hands.map((h) => h.length);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(18);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    expect(new Set(hands.flat()).size).toBe(18);
    const pub = clients[0]!.lastPublic()!;
    expect(pub.status).toBe("IN_PROGRESS");
    expect(pub.envelope).toBeNull();
    expect(pub.pawns).toHaveLength(6);
    expect(pub.weapons).toHaveLength(6);
    for (const [i, c] of clients.entries()) {
      expect(c.lastPrivate()!.playerId).toBe(c.playerId);
      expect(pub.players.find((p) => p.id === c.playerId)!.cardCount).toBe(sizes[i]);
      expect(c.lastRoom()!.phase).toBe("IN_PROGRESS");
    }
  });

  it("re-sends room, public and private state on reconnect", async () => {
    const { clients } = await startedRoom(app, ["Alice", "Bob"]);
    track(clients);
    const bob = clients[1]!;
    bob.socket.disconnect();
    const again = await connectClient(app, "Bob", { playerId: bob.playerId, token: bob.token });
    track([again]);
    await waitFor(() => again.lastPrivate() !== undefined && again.lastPublic() !== undefined);
    expect(again.lastPrivate()!.hand).toEqual(bob.lastPrivate()!.hand);
  });
});

describe("turns", () => {
  it("roll out of turn → NOT_YOUR_TURN; scripted dice are used", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await bob.send("turn:roll")).toEqual({ ok: false, code: "NOT_YOUR_TURN" });
    await applyScenario(app, code, { dice: [[3, 4]], activePlayer: "Alice" });
    expect(alice.lastPrivate()!.availableActions).toContain("roll");
    expect(await alice.send("turn:roll")).toEqual({ ok: true });
    // state is emitted before the ack
    expect(alice.lastPublic()!.turn.dice).toEqual([3, 4]);
    await waitFor(() => bob.lastPublic()?.turn.dice?.[1] === 4);
    expect(bob.lastPublic()!.events.at(-1)!.event).toEqual({
      type: "rolled",
      playerId: alice.playerId,
      dice: [3, 4],
    });
    expect(alice.lastPrivate()!.reachable.length).toBeGreaterThan(0);
    expect(await alice.send("turn:end")).toEqual({ ok: true });
    await waitFor(() => bob.lastPublic()?.turn.playerId === bob.playerId);
  });
});

/** Recursively collects values of a given key. */
function valuesOfKey(value: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(value)) value.forEach((v) => valuesOfKey(v, key, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === key) out.push(v);
      valuesOfKey(v, key, out);
    }
  }
  return out;
}

describe("suggestion, disprove, accusation, return to lobby (privacy)", () => {
  it("never leaks the envelope, other hands or reveals", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    await applyScenario(app, code, suggestionScenario);
    const carolSinceScenario = carol.events.length;
    expect(alice.lastPrivate()!.hand).toEqual(HANDS.Alice);
    expect(alice.lastPrivate()!.availableActions).toContain("suggest");

    expect(await alice.send("turn:suggest", { suspect: "white", weapon: "dagger" })).toEqual({ ok: true });
    await waitFor(() => bob.lastPrivate()?.disproveRequest != null);
    expect(bob.lastPrivate()!.disproveRequest).toEqual({
      suggesterId: alice.playerId,
      suggestion: { suspect: "white", weapon: "dagger", room: "kitchen" },
      matchingCards: expect.arrayContaining(["white", "dagger"]),
    });
    expect(bob.lastPrivate()!.availableActions).toContain("disprove");
    expect(alice.lastPublic()!.turn.pendingSuggestion?.disproverId).toBe(bob.playerId);
    expect(carol.lastPrivate()!.disproveRequest).toBeNull();

    expect(await carol.send("turn:disprove", { cardId: "dagger" })).toEqual({
      ok: false,
      code: "NOT_YOUR_DISPROVE",
    });
    expect(await bob.send("turn:disprove", { cardId: "dagger" })).toEqual({ ok: true });
    await waitFor(() => (alice.lastPrivate()?.seenCards.length ?? 0) > 0);
    await settle();
    expect(alice.lastPrivate()!.seenCards).toEqual([{ cardId: "dagger", fromPlayerId: bob.playerId }]);
    expect(bob.lastPrivate()!.seenCards).toEqual([]);
    expect(carol.lastPrivate()!.seenCards).toEqual([]);
    expect(carol.lastPublic()!.events.at(-1)!.event).toEqual({
      type: "card_shown",
      playerId: bob.playerId,
      toPlayerId: alice.playerId,
    });

    // ── privacy audit of everything received so far (game not finished) ──
    const ownHand = (c: Client) => [...(HANDS[c.name] ?? [])];
    const dealtHands = clients.map(
      (c) => (c.events.find((x) => x.event === "game:private")!.payload as { hand: string[] }).hand,
    );
    expect(new Set(dealtHands.flat()).size).toBe(18); // dealt hands are pairwise disjoint
    for (const c of clients) {
      for (const e of c.events) assertPrivate(c, e);
      // after the scenario, every private hand is exactly the player's own
      const lastHand = c.lastPrivate()!.hand;
      expect([...lastHand].sort()).toEqual(ownHand(c).sort());
    }
    // Carol never got the revealed card in any cardId / matchingCards field, nor in a
    // hand after the scenario (her randomly dealt hand may have contained it).
    for (const [i, e] of carol.events.entries()) {
      expect(valuesOfKey(e.payload, "cardId")).not.toContain("dagger");
      if (i >= carolSinceScenario) expect(valuesOfKey(e.payload, "hand").flat()).not.toContain("dagger");
      expect(valuesOfKey(e.payload, "matchingCards")).toEqual([]);
    }

    // ── correct accusation → straight back to LOBBY with lastResult and a new id ──
    const oldId = carol.lastRoom()!.id;
    expect(await alice.send("turn:accuse", ENVELOPE)).toEqual({ ok: true });
    await waitFor(() => carol.lastRoom()?.phase === "LOBBY");
    const room = carol.lastRoom()!;
    expect(room.id).not.toBe(oldId);
    expect(room.lastResult).toEqual({
      winnerId: alice.playerId,
      winnerName: "Alice",
      reason: "ACCUSATION",
      envelope: ENVELOPE,
    });
    expect(room.players.map((p) => p.characterId)).toEqual(["red", "yellow", "white"]);
    expect(room.players.map((p) => p.presence)).toEqual(["online", "online", "online"]);
    // No game:state after the lobby return; the envelope only via lastResult.
    for (const e of carol.events) if (e.event === "game:state") expect(e.payload.envelope).toBeNull();
    expect(await alice.send("room:start")).toEqual({ ok: true });
    await waitFor(() => carol.lastPublic()?.gameId === carol.lastRoom()?.id);
  });

  it("a wrong accusation shows the envelope only to the accuser", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    await applyScenario(app, code, {
      envelope: ENVELOPE,
      activePlayer: "Alice",
      pawns: { red: { kind: "room", roomId: "kitchen" } },
    });
    expect(
      await alice.send("turn:accuse", { suspect: "red", weapon: "rope", room: "study" }),
    ).toEqual({ ok: true });
    await waitFor(() => alice.lastPrivate()?.envelope != null);
    await settle();
    expect(alice.lastPrivate()!.envelope).toEqual(ENVELOPE);
    expect(bob.lastPrivate()!.envelope).toBeNull();
    expect(carol.lastPrivate()!.envelope).toBeNull();
    const pub = carol.lastPublic()!;
    expect(pub.status).toBe("IN_PROGRESS");
    expect(pub.envelope).toBeNull();
    expect(pub.players.find((p) => p.id === alice.playerId)!.eliminated).toBe(true);
    for (const e of [...bob.events, ...carol.events]) {
      if (e.event === "game:private") expect(e.payload.envelope).toBeNull();
      if (e.event === "game:state") expect(e.payload.envelope).toBeNull();
    }
  });

  it("scenario with an unknown player name → 400", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob"]);
    track(clients);
    const res = await fetch(`${app.url}/testing/rooms/${code}/scenario`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ activePlayer: "Nobody" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: "INVALID_PAYLOAD" });
  });
});

describe("projection fields", () => {
  it("game:state contains settings, the turn timer, roomsWithCards []; game:private contains roomCards []", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await alice.send("room:settings", { autoNotes: false })).toEqual({ ok: true });
    await alice.send("room:choose_character", { characterId: "red" });
    await bob.send("room:choose_character", { characterId: "yellow" });
    expect(await alice.send("room:start")).toEqual({ ok: true });
    await waitFor(() => bob.lastPublic() !== undefined && bob.lastPrivate() !== undefined);
    const pub = bob.lastPublic()!;
    expect(pub.settings).toEqual(bob.lastRoom()!.settings);
    expect(pub.settings.autoNotes).toBe(false);
    expect(pub.timer).toMatchObject({ kind: "turn", playerId: pub.turn.playerId, durationMs: 90_000 });
    expect(pub.roomsWithCards).toEqual([]);
    expect(bob.lastPrivate()!.roomCards).toEqual([]);
  });

  it("game:state contains the full event history", async () => {
    const { clients } = await startedRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    for (let i = 0; i < 30; i++) {
      const active = i % 2 === 0 ? alice : bob;
      expect(await active.send("turn:roll")).toEqual({ ok: true });
      expect(await active.send("turn:end")).toEqual({ ok: true });
    }
    await settle();
    const events = alice.lastPublic()!.events;
    // game_started + 30 × (rolled + turn_ended)
    expect(events.length).toBe(61);
    expect(events[0]!.seq).toBe(0);
    expect(events[0]!.event.type).toBe("game_started");
    expect(events.map((e) => e.seq)).toEqual(events.map((_, i) => i));
  });
});

describe("face-down room cards", () => {
  const startWithRoomCards = async (n: number) => {
    const { code, clients } = await createRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    expect(await alice.send("room:settings", { roomCards: n })).toEqual({ ok: true });
    await alice.send("room:choose_character", { characterId: "red" });
    await bob.send("room:choose_character", { characterId: "yellow" });
    await carol.send("room:choose_character", { characterId: "white" });
    expect(await alice.send("room:start")).toEqual({ ok: true });
    await waitFor(() => clients.every((c) => c.lastPrivate() !== undefined && c.lastPublic() !== undefined));
    return { code, alice, bob, carol };
  };

  it("game:state.roomsWithCards lists rooms; hands shrink by the room cards", async () => {
    const { alice, bob, carol } = await startWithRoomCards(6);
    const pub = carol.lastPublic()!;
    expect(pub.roomsWithCards).toHaveLength(6);
    expect(new Set(pub.roomsWithCards).size).toBe(6);
    expect(alice.lastPublic()!.roomsWithCards).toEqual(pub.roomsWithCards);
    const hands = [alice, bob, carol].map((c) => c.lastPrivate()!.hand);
    expect(hands.flat()).toHaveLength(12);
    expect(pub.players.map((p) => p.cardCount)).toEqual([4, 4, 4]);
    // all pawns start on cells: nobody has stood in a room yet
    for (const c of [alice, bob, carol]) expect(c.lastPrivate()!.roomCards).toEqual([]);
  });

  it("room card id reaches only players who stood in the room", async () => {
    const { code, alice, bob, carol } = await startWithRoomCards(2);
    const ROOM_CARD = "wrench";
    await applyScenario(app, code, {
      envelope: ENVELOPE,
      hands: { ...HANDS, Carol: ["blue", "purple", "revolver", "lounge", "hall"] },
      roomCards: { kitchen: ROOM_CARD, lounge: "dining_room" },
      pawns: { red: { kind: "room", roomId: "kitchen" } },
      summonedTo: { Alice: "kitchen" },
      activePlayer: "Alice",
    });
    await waitFor(() => alice.lastPrivate()!.roomCards.length > 0);
    // Alice stands in the kitchen; nobody has been in the lounge.
    expect(alice.lastPrivate()!.roomCards).toEqual([{ roomId: "kitchen", cardId: ROOM_CARD }]);
    expect(bob.lastPrivate()!.roomCards).toEqual([]);
    expect([...carol.lastPublic()!.roomsWithCards].sort()).toEqual(["kitchen", "lounge"]);

    // Alice summons Bob's character (yellow) to the kitchen → Bob may peek too.
    expect(await alice.send("turn:suggest", { suspect: "yellow", weapon: "dagger" })).toEqual({ ok: true });
    await waitFor(() => bob.lastPrivate()!.roomCards.length > 0);
    expect(bob.lastPrivate()!.roomCards).toEqual([{ roomId: "kitchen", cardId: ROOM_CARD }]);
    await settle();

    // Carol never stood in a room: no room card in anything she received.
    for (const e of carol.events) {
      expect(valuesOfKey(e.payload, "cardId")).not.toContain(ROOM_CARD);
      expect(valuesOfKey(e.payload, "cardId")).not.toContain("dining_room");
      if (e.event === "game:private") expect(e.payload.roomCards).toEqual([]);
    }
    // No public payload (anyone's) ever carries room card ids.
    for (const c of [alice, bob, carol]) {
      for (const e of c.events) {
        if (e.event !== "game:state") continue;
        // settings.roomCards is the public count; any other value would be a leak.
        expect(valuesOfKey(e.payload, "roomCards")).toEqual([e.payload.settings.roomCards]);
        expect(typeof e.payload.settings.roomCards).toBe("number");
        expect(valuesOfKey(e.payload, "cardId")).toEqual([]);
      }
    }
  });
});

/** Invariants that must hold for every event received before FINISHED. */
function assertPrivate(client: Client, e: RecordedEvent): void {
  if (e.event === "game:state") {
    expect(e.payload.envelope).toBeNull();
    for (const key of ["hand", "hands", "seenCards", "reveals", "cardId", "matchingCards"]) {
      expect(valuesOfKey(e.payload, key)).toEqual([]);
    }
  }
  if (e.event === "game:private") {
    const p = e.payload;
    expect(p.playerId).toBe(client.playerId);
    expect(p.envelope).toBeNull();
    if (client.name !== "Alice") expect(p.seenCards).toEqual([]);
    if (client.name !== "Bob") expect(p.disproveRequest).toBeNull();
    // Only ever the player's own cards: the dealt hand (first private) or the scripted one.
    const dealt = client.events.find((x) => x.event === "game:private")!.payload as typeof p;
    const scripted = HANDS[client.name] ?? [];
    const sorted = [...p.hand].sort();
    expect([[...dealt.hand].sort(), [...scripted].sort()]).toContainEqual(sorted);
  }
}
