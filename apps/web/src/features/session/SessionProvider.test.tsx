import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionProvider } from "./SessionProvider.js";
import { useSession } from "./SessionContext.js";
import { loadSession, saveSession } from "./storage.js";

function Probe() {
  const { status, session } = useSession();
  return <p>{status === "restoring" ? "restoring" : session ? `in ${session.roomCode}` : "none"}</p>;
}

const stored = { roomCode: "1234", token: "tok", playerId: "p1" };
const room = { id: "g", code: "1234", hostId: "p1", maxPlayers: 6, phase: "LOBBY", players: [] };

describe("SessionProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("restores a stored session with the bearer token", async () => {
    saveSession(stored);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ room, session: { playerId: "p1", token: "tok" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(await screen.findByText("in 1234")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/rooms\/1234\/session$/);
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("drops the stored session on 401", async () => {
    saveSession(stored);
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ code: "UNAUTHORIZED" }), { status: 401 }),
    ));
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(await screen.findByText("none")).toBeInTheDocument();
    await waitFor(() => expect(loadSession("1234")).toBeNull());
  });

  it("starts without a session when nothing is stored", () => {
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
