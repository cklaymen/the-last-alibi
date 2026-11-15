import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { saveSession } from "../features/session/index.js";
import { App } from "./App.js";

type Handler = (...args: unknown[]) => void;
const handlers = new Map<string, Handler>();
const ioMock = vi.fn((..._args: unknown[]) => ({
  on: (event: string, h: Handler) => handlers.set(event, h),
  connect: vi.fn(),
  removeAllListeners: vi.fn(),
  close: vi.fn(),
}));
vi.mock("socket.io-client", () => ({ io: (...args: unknown[]) => ioMock(...args) }));

const room = {
  id: "g", code: "1234", hostId: "p0", maxPlayers: 6, phase: "LOBBY", lastResult: null,
  players: [{ id: "p1", name: "Ada", presence: "online" }],
};

async function enterRoom() {
  saveSession({ roomCode: "1234", token: "tok", playerId: "p1" });
  window.history.replaceState(null, "", "/room/1234");
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(JSON.stringify({ room, session: { playerId: "p1", token: "tok" } }), { status: 200 }),
  ));
  render(<App />);
  return screen.findByRole("button", { name: "Change nickname" });
}

describe("App shell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    handlers.clear();
  });

  it("shows my nickname in the header while in a room", async () => {
    expect(await enterRoom()).toHaveTextContent("Ada");
    await waitFor(() =>
      expect(ioMock).toHaveBeenLastCalledWith("http://localhost:3000", { auth: { token: "tok" } }),
    );
  });

  it("room:kicked → home with an alert", async () => {
    await enterRoom();
    act(() => handlers.get("room:kicked")!());
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("alert")).toHaveTextContent("The host removed you from the room.");
    expect(screen.getByRole("button", { name: "Create room" })).toBeInTheDocument();
  });

  it("UNAUTHORIZED on connect → join-by-link form for the same room", async () => {
    await enterRoom();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    act(() => handlers.get("connect_error")!(new Error("UNAUTHORIZED")));
    expect(window.location.pathname).toBe("/room/1234");
    expect(screen.getByRole("heading", { name: "Join room 1234" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired.");
  });
});
