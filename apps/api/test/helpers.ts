import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  CommandResult,
  PrivateGameState,
  PublicGameState,
  RoomSessionResponse,
  RoomSummary,
  Scenario,
  ServerToClientEvents,
} from "@mystery-game/contracts";
import type { CharacterId } from "@mystery-game/game";
import { AppModule } from "../src/app.module.js";

export interface TestApp {
  url: string;
  close(): Promise<void>;
}

export async function startApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot({ enableTestApi: true })],
  }).compile();
  const app: INestApplication = moduleRef.createNestApplication({ logger: false });
  await app.listen(0, "127.0.0.1");
  const url = (await app.getUrl()).replace("[::1]", "127.0.0.1");
  return { url, close: () => app.close() };
}

export interface HttpResult<T> {
  status: number;
  body: T;
}

export async function http<T = unknown>(
  app: TestApp,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  token?: string,
): Promise<HttpResult<T>> {
  const res = await fetch(`${app.url}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: (await res.json()) as T };
}

export type RecordedEvent =
  | { event: "room:state"; payload: RoomSummary }
  | { event: "game:state"; payload: PublicGameState }
  | { event: "game:private"; payload: PrivateGameState };

export interface Client {
  name: string;
  playerId: string;
  token: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  events: RecordedEvent[];
  lastRoom(): RoomSummary | undefined;
  lastPublic(): PublicGameState | undefined;
  lastPrivate(): PrivateGameState | undefined;
  send(event: keyof ClientToServerEvents, payload?: unknown): Promise<CommandResult>;
}

export function connectSocket(
  app: TestApp,
  token: string | undefined,
): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(app.url, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    ...(token !== undefined ? { auth: { token } } : {}),
  });
}

export async function connectClient(
  app: TestApp,
  name: string,
  session: RoomSessionResponse["session"],
): Promise<Client> {
  const socket = connectSocket(app, session.token);
  const events: RecordedEvent[] = [];
  socket.on("room:state", (payload) => events.push({ event: "room:state", payload }));
  socket.on("game:state", (payload) => events.push({ event: "game:state", payload }));
  socket.on("game:private", (payload) => events.push({ event: "game:private", payload }));
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", reject);
  });
  await waitFor(() => events.some((e) => e.event === "room:state"));
  const last = <E extends RecordedEvent["event"]>(event: E) =>
    (events.filter((e) => e.event === event).at(-1)?.payload) as
      | Extract<RecordedEvent, { event: E }>["payload"]
      | undefined;
  return {
    name,
    playerId: session.playerId,
    token: session.token,
    socket,
    events,
    lastRoom: () => last("room:state"),
    lastPublic: () => last("game:state"),
    lastPrivate: () => last("game:private"),
    send: (event, payload = {}) =>
      new Promise<CommandResult>((resolve) => {
        (socket.emit as (e: string, p: unknown, ack: (r: CommandResult) => void) => void)(
          event,
          payload,
          resolve,
        );
      }),
  };
}

export async function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 10));
  }
}

/** Lets in-flight socket broadcasts arrive. */
export const settle = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function createRoom(app: TestApp, names: string[]): Promise<{ code: string; clients: Client[] }> {
  const [host, ...rest] = names;
  const created = await http<RoomSessionResponse>(app, "POST", "/rooms", { playerName: host });
  const code = created.body.room.code;
  const sessions = [created.body.session];
  for (const name of rest) {
    const joined = await http<RoomSessionResponse>(app, "POST", "/rooms/join", {
      playerName: name,
      roomCode: code,
    });
    sessions.push(joined.body.session);
  }
  const clients: Client[] = [];
  for (const [i, session] of sessions.entries()) {
    clients.push(await connectClient(app, names[i] ?? "", session));
  }
  return { code, clients };
}

const SEATS: CharacterId[] = ["red", "yellow", "white", "green", "blue", "purple"];

/** Creates a room, picks characters in seat order and starts the game. */
export async function startedRoom(
  app: TestApp,
  names: string[],
): Promise<{ code: string; clients: Client[] }> {
  const room = await createRoom(app, names);
  for (const [i, client] of room.clients.entries()) {
    const res = await client.send("room:choose_character", { characterId: SEATS[i] });
    if (!res.ok) throw new Error(`choose_character failed: ${res.code}`);
  }
  const started = await room.clients[0]!.send("room:start");
  if (!started.ok) throw new Error(`start failed: ${started.code}`);
  await waitFor(() => room.clients.every((c) => c.lastPrivate() !== undefined));
  return room;
}

export async function applyScenario(app: TestApp, code: string, scenario: Scenario): Promise<void> {
  const res = await http(app, "POST", `/testing/rooms/${code}/scenario`, scenario);
  if (res.status !== 200) throw new Error(`scenario failed: ${JSON.stringify(res.body)}`);
  await settle();
}
