import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { CardId, ErrorResponse, Scenario } from "@mystery-game/contracts";
import {
  applyScenario,
  connectClient,
  createRoom,
  http,
  presenceOf,
  settle,
  startApp,
  startedRoom,
  waitFor,
  type Client,
  type TestApp,
} from "./helpers.js";

const GRACE_MS = 1000;

let app: TestApp;
let open: Client[] = [];
beforeAll(async () => {
  app = await startApp({ graceMs: GRACE_MS });
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
const scenario: Scenario = {
  envelope: ENVELOPE,
  hands: HANDS,
  pawns: { red: { kind: "room", roomId: "kitchen" } },
  summonedTo: { Alice: "kitchen" },
  activePlayer: "Alice",
};

describe("presence in the lobby", () => {
  it("online → offline on disconnect; reconnect within grace keeps the player", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    await waitFor(() => presenceOf(alice, bob.playerId) === "online");
    bob.socket.disconnect();
    await waitFor(() => presenceOf(alice, bob.playerId) === "offline");
    const again = await connectClient(app, "Bob", { playerId: bob.playerId, token: bob.token });
    track([again]);
    await waitFor(() => presenceOf(alice, bob.playerId) === "online");
    await settle(GRACE_MS + 150);
    expect(alice.lastRoom()!.players).toHaveLength(2);
  });

  it("several tabs: offline only after the last socket disconnects", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    const secondTab = await connectClient(app, "Bob", { playerId: bob.playerId, token: bob.token });
    track([secondTab]);
    bob.socket.disconnect();
    await settle(GRACE_MS + 150);
    expect(presenceOf(alice, bob.playerId)).toBe("online");
    expect(alice.lastRoom()!.players).toHaveLength(2);
  });

  it("after the grace period: removed, host passes on, session invalid, empty room deleted", async () => {
    const { code, clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    alice.socket.disconnect();
    await waitFor(() => bob.lastRoom()?.players.length === 1);
    expect(bob.lastRoom()!.hostId).toBe(bob.playerId);
    expect(
      await http<ErrorResponse>(app, "GET", `/rooms/${code}/session`, undefined, alice.token),
    ).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });

    bob.socket.disconnect();
    await waitFor(() => false, GRACE_MS + 200).catch(() => undefined);
    expect(await http<ErrorResponse>(app, "GET", `/rooms/${code}`)).toEqual({
      status: 404,
      body: { code: "ROOM_NOT_FOUND" },
    });
    expect(
      await http<ErrorResponse>(app, "GET", `/rooms/${code}/session`, undefined, bob.token),
    ).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
  });
});

describe("presence during a game", () => {
  it("away player: auto-disprove, turn skipped, back online on reconnect", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    await applyScenario(app, code, scenario);

    bob.socket.disconnect();
    await waitFor(
      () => alice.lastPublic()?.players.find((p) => p.id === bob.playerId)?.presence === "offline",
    );
    await waitFor(() => presenceOf(alice, bob.playerId) === "away");
    expect(alice.lastPublic()!.players.find((p) => p.id === bob.playerId)!.presence).toBe("away");
    expect(alice.lastRoom()!.players).toHaveLength(3);

    // Bob holds white + dagger → the server shows one for him.
    expect(await alice.send("turn:suggest", { suspect: "white", weapon: "dagger" })).toEqual({ ok: true });
    await waitFor(() => (alice.lastPrivate()?.seenCards.length ?? 0) === 1);
    const seen = alice.lastPrivate()!.seenCards[0]!;
    expect(seen.fromPlayerId).toBe(bob.playerId);
    expect(["white", "dagger"]).toContain(seen.cardId);
    expect(alice.lastPublic()!.turn.pendingSuggestion).toBeNull();

    // Alice ends the turn → Bob's turn is skipped → Carol.
    expect(await alice.send("turn:end")).toEqual({ ok: true });
    await waitFor(() => carol.lastPublic()?.turn.playerId === carol.playerId);
    const types = carol.lastPublic()!.events.slice(-2).map((e) => e.event);
    expect(types).toEqual([
      { type: "turn_ended", playerId: alice.playerId },
      { type: "turn_skipped", playerId: bob.playerId },
    ]);

    const again = await connectClient(app, "Bob", { playerId: bob.playerId, token: bob.token });
    track([again]);
    await waitFor(() => presenceOf(carol, bob.playerId) === "online");
    expect(carol.lastPublic()!.players.find((p) => p.id === bob.playerId)!.presence).toBe("online");
    expect(again.lastPrivate()!.hand).toEqual(HANDS.Bob);

    // Carol → Alice → Bob plays normally again.
    expect(await carol.send("turn:end")).toEqual({ ok: true });
    await waitFor(() => alice.lastPublic()?.turn.playerId === alice.playerId);
    expect(await alice.send("turn:end")).toEqual({ ok: true });
    await waitFor(() => again.lastPublic()?.turn.playerId === bob.playerId);
    expect(again.lastPrivate()!.availableActions.length).toBeGreaterThan(0);
  });

  it("turn passing to an away player is skipped right away", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    await applyScenario(app, code, { activePlayer: "Bob" });
    bob.socket.disconnect();
    // Bob is active when he becomes away → skipped to Carol by the presence change itself.
    await waitFor(() => carol.lastPublic()?.turn.playerId === carol.playerId);
    expect(carol.lastPublic()!.events.at(-1)!.event).toEqual({ type: "turn_skipped", playerId: bob.playerId });
    expect(alice.lastRoom()!.phase).toBe("IN_PROGRESS");
  });

  it("game end returns to the lobby and removes away players", async () => {
    const { code, clients } = await startedRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    await applyScenario(app, code, { envelope: ENVELOPE, activePlayer: "Alice" });
    const oldId = alice.lastRoom()!.id;
    carol.socket.disconnect();
    await waitFor(() => presenceOf(alice, carol.playerId) === "away");

    expect(await alice.send("turn:accuse", ENVELOPE)).toEqual({ ok: true });
    await waitFor(() => bob.lastRoom()?.phase === "LOBBY");
    const room = bob.lastRoom()!;
    expect(room.id).not.toBe(oldId);
    expect(room.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(room.lastResult).toMatchObject({ winnerId: alice.playerId, reason: "ACCUSATION", envelope: ENVELOPE });
    expect(
      await http<ErrorResponse>(app, "GET", `/rooms/${code}/session`, undefined, carol.token),
    ).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
  });
});
