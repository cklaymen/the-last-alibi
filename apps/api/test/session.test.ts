import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ErrorResponse, RoomSessionResponse } from "@mystery-game/contracts";
import { connectClient, connectSocket, createRoom, http, startApp, waitFor, type TestApp } from "./helpers.js";

let app: TestApp;
beforeAll(async () => {
  app = await startApp();
});
afterAll(async () => {
  await app.close();
});

describe("HTTP rooms & sessions", () => {
  it("GET /health", async () => {
    const res = await http(app, "GET", "/health");
    expect(res).toEqual({ status: 200, body: { status: "ok" } });
  });

  it("creates, joins and restores a session", async () => {
    const created = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Alice" });
    expect(created.status).toBe(201);
    const { room, session } = created.body;
    expect(room).toMatchObject({ phase: "LOBBY", hostId: session.playerId, maxPlayers: 6 });
    expect(room.players).toEqual([{ id: session.playerId, name: "Alice" }]);
    expect(session.token).toMatch(/[0-9a-f-]{36}/);

    const joined = await http<RoomSessionResponse>(app, "POST", "/rooms/join", {
      playerName: "  Bob ",
      roomCode: room.code,
    });
    expect(joined.status).toBe(200);
    expect(joined.body.room.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(joined.body.session.playerId).not.toBe(session.playerId);

    const restored = await http<RoomSessionResponse>(
      app,
      "GET",
      `/rooms/${room.code}/session`,
      undefined,
      joined.body.session.token,
    );
    expect(restored.status).toBe(200);
    expect(restored.body.session).toEqual(joined.body.session);
    expect(restored.body.room.players).toHaveLength(2);
  });

  it("rejects restore with an unknown token or a token of another room", async () => {
    const a = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Alice" });
    const b = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Bob" });
    const bad = await http<ErrorResponse>(app, "GET", `/rooms/${a.body.room.code}/session`, undefined, "nope");
    expect(bad).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
    const none = await http<ErrorResponse>(app, "GET", `/rooms/${a.body.room.code}/session`);
    expect(none).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
    const other = await http<ErrorResponse>(
      app,
      "GET",
      `/rooms/${a.body.room.code}/session`,
      undefined,
      b.body.session.token,
    );
    expect(other).toEqual({ status: 401, body: { code: "UNAUTHORIZED" } });
  });

  it("NAME_TAKEN within a room (case-insensitive), same name fine in another room", async () => {
    const a = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Alice" });
    const dup = await http<ErrorResponse>(app, "POST", "/rooms/join", {
      playerName: " alice ",
      roomCode: a.body.room.code,
    });
    expect(dup).toEqual({ status: 409, body: { code: "NAME_TAKEN" } });

    const b = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Bob" });
    const ok = await http<RoomSessionResponse>(app, "POST", "/rooms/join", {
      playerName: "Alice",
      roomCode: b.body.room.code,
    });
    expect(ok.status).toBe(200);
  });

  it("maps join errors", async () => {
    const missing = await http<ErrorResponse>(app, "POST", "/rooms/join", {
      playerName: "Zed",
      roomCode: "000000",
    });
    expect(missing).toEqual({ status: 404, body: { code: "ROOM_NOT_FOUND" } });

    const invalid = await http<ErrorResponse>(app, "POST", "/rooms/join", { playerName: "Z" });
    expect(invalid).toEqual({ status: 400, body: { code: "INVALID_PAYLOAD" } });

    const a = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "P0" });
    for (let i = 1; i < 6; i++) {
      const r = await http(app, "POST", "/rooms/join", { playerName: `P${i}`, roomCode: a.body.room.code });
      expect(r.status).toBe(200);
    }
    const full = await http<ErrorResponse>(app, "POST", "/rooms/join", {
      playerName: "P6",
      roomCode: a.body.room.code,
    });
    expect(full).toEqual({ status: 409, body: { code: "GAME_FULL" } });
  });

  it("broadcasts room:state to the room when someone joins via HTTP", async () => {
    const { code, clients } = await createRoom(app, ["Alice"]);
    const alice = clients[0]!;
    await http(app, "POST", "/rooms/join", { playerName: "Bob", roomCode: code });
    await waitFor(() => alice.lastRoom()?.players.length === 2);
    alice.socket.disconnect();
  });
});

describe("socket authentication", () => {
  const expectRejected = async (token: string | undefined) => {
    const socket = connectSocket(app, token);
    const err = await new Promise<Error>((resolve, reject) => {
      socket.once("connect_error", resolve);
      socket.once("connect", () => reject(new Error("connected")));
    });
    expect(err.message).toBe("UNAUTHORIZED");
    socket.disconnect();
  };

  it("rejects a socket without a token", () => expectRejected(undefined));
  it("rejects a socket with an unknown token", () => expectRejected("not-a-token"));

  it("accepts a valid token and sends room:state", async () => {
    const created = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: "Alice" });
    const client = await connectClient(app, "Alice", created.body.session);
    expect(client.lastRoom()?.code).toBe(created.body.room.code);
    expect(client.lastPublic()).toBeUndefined();
    client.socket.disconnect();
  });

  it("acks INVALID_PAYLOAD for a malformed command", async () => {
    const { clients } = await createRoom(app, ["Alice"]);
    const res = await clients[0]!.send("room:choose_character", { characterId: "nobody" });
    expect(res).toEqual({ ok: false, code: "INVALID_PAYLOAD" });
    clients[0]!.socket.disconnect();
  });
});
