import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ErrorResponse, RoomSessionResponse } from "@mystery-game/contracts";
import {
  connectSocket,
  createRoom,
  http,
  startApp,
  startedRoom,
  waitFor,
  type Client,
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

describe("GET /rooms/:code", () => {
  it("returns code, phase and player count", async () => {
    const { code, clients } = await createRoom(app, ["Alice", "Bob"]);
    track(clients);
    expect(await http(app, "GET", `/rooms/${code}`)).toEqual({
      status: 200,
      body: { code, phase: "LOBBY", playerCount: 2 },
    });
  });

  it("404 ROOM_NOT_FOUND for unknown or malformed codes", async () => {
    expect(await http<ErrorResponse>(app, "GET", "/rooms/000000")).toEqual({
      status: 404,
      body: { code: "ROOM_NOT_FOUND" },
    });
    expect(await http<ErrorResponse>(app, "GET", "/rooms/abc")).toEqual({
      status: 404,
      body: { code: "ROOM_NOT_FOUND" },
    });
  });
});

describe("room:kick", () => {
  it("only the host can kick, and not themselves", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await bob.send("room:kick", { playerId: alice.playerId })).toEqual({
      ok: false,
      code: "NOT_HOST",
    });
    expect(await alice.send("room:kick", { playerId: alice.playerId })).toEqual({
      ok: false,
      code: "CANNOT_KICK_SELF",
    });
    expect(await alice.send("room:kick", { playerId: "nobody" })).toEqual({
      ok: false,
      code: "PLAYER_NOT_FOUND",
    });
  });

  it("kicked player gets room:kicked, is disconnected and loses the session", async () => {
    const { code, clients } = await createRoom(app, ["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = track(clients) as [Client, Client, Client];
    expect(await alice.send("room:kick", { playerId: bob.playerId })).toEqual({ ok: true });
    await waitFor(() => bob.events.some((e) => e.event === "disconnect"));
    const kickedAt = bob.events.findIndex((e) => e.event === "room:kicked");
    const disconnectedAt = bob.events.findIndex((e) => e.event === "disconnect");
    expect(kickedAt).toBeGreaterThanOrEqual(0);
    expect(kickedAt).toBeLessThan(disconnectedAt);
    expect(bob.socket.connected).toBe(false);

    await waitFor(() => carol.lastRoom()?.players.length === 2);
    expect(carol.lastRoom()!.players.map((p) => p.name)).toEqual(["Alice", "Carol"]);
    expect(carol.events.some((e) => e.event === "room:kicked")).toBe(false);

    const restore = await http<ErrorResponse>(app, "GET", `/rooms/${code}/session`, undefined, bob.token);
    expect(restore).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
    const socket = connectSocket(app, bob.token);
    const err = await new Promise<Error>((resolve, reject) => {
      socket.once("connect_error", resolve);
      socket.once("connect", () => reject(new Error("connected")));
    });
    expect(err.message).toBe("UNAUTHORIZED");
    socket.disconnect();

    // The name is free again.
    const rejoined = await http<RoomSessionResponse>(app, "POST", "/rooms/join", {
      playerName: "Bob",
      roomCode: code,
    });
    expect(rejoined.status).toBe(200);
  });

  it("cannot kick during a game", async () => {
    const { clients } = await startedRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await alice.send("room:kick", { playerId: bob.playerId })).toEqual({
      ok: false,
      code: "GAME_NOT_IN_LOBBY",
    });
  });
});

describe("room:rename", () => {
  it("renames and broadcasts; NAME_TAKEN case-insensitively; validates length", async () => {
    const { clients } = await createRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await bob.send("room:rename", { name: " ALICE " })).toEqual({ ok: false, code: "NAME_TAKEN" });
    expect(await bob.send("room:rename", { name: "B" })).toEqual({ ok: false, code: "INVALID_PAYLOAD" });
    expect(await bob.send("room:rename", { name: "  Robert " })).toEqual({ ok: true });
    await waitFor(() => alice.lastRoom()?.players[1]?.name === "Robert");
    // Own name again (unchanged) is fine.
    expect(await bob.send("room:rename", { name: "robert" })).toEqual({ ok: true });
  });

  it("works during a game and updates the public state", async () => {
    const { clients } = await startedRoom(app, ["Alice", "Bob"]);
    const [alice, bob] = track(clients) as [Client, Client];
    expect(await alice.send("room:rename", { name: "Alicia" })).toEqual({ ok: true });
    await waitFor(() => bob.lastPublic()?.players.some((p) => p.name === "Alicia") === true);
    expect(bob.lastRoom()!.players[0]!.name).toBe("Alicia");
  });
});

describe("removed commands", () => {
  it("room:restart no longer exists (no ack handler)", async () => {
    const { clients } = await createRoom(app, ["Alice"]);
    const [alice] = track(clients) as [Client];
    const acked = await Promise.race([
      new Promise<boolean>((resolve) =>
        (alice.socket.emit as (e: string, p: unknown, ack: () => void) => void)("room:restart", {}, () =>
          resolve(true),
        ),
      ),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 200)),
    ]);
    expect(acked).toBe(false);
  });
});
