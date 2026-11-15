import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { SessionProvider } from "./SessionProvider.js";
import { useSession } from "./SessionContext.js";
import { loadLocalSession, loadSession, saveSession } from "./storage.js";

function Probe() {
  const { status, session, notice, leave } = useSession();
  return (
    <>
      <p>{status === "restoring" ? "restoring" : session ? `in ${session.roomCode}` : "none"}</p>
      <p>notice: {notice ?? "-"}</p>
      <button onClick={() => leave("kicked")}>kick</button>
    </>
  );
}

const stored = { roomCode: "1234", token: "tok", playerId: "p1" };
const room = {
  id: "g", code: "1234", hostId: "p1", maxPlayers: 6, phase: "LOBBY", players: [], lastResult: null,
};
const ok = () =>
  vi.fn(async () =>
    new Response(JSON.stringify({ room, session: { playerId: "p1", token: "tok" } }), { status: 200 }),
  );

const renderProvider = () => render(<SessionProvider><Probe /></SessionProvider>);

describe("SessionProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("at /room/<code> restores that room's session with the bearer token", async () => {
    saveSession(stored);
    window.history.replaceState(null, "", "/room/1234");
    const fetchMock = ok();
    vi.stubGlobal("fetch", fetchMock);
    renderProvider();
    expect(await screen.findByText("in 1234")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/rooms\/1234\/session$/);
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("at /room/<code> uses the localStorage fallback when the tab has no session", async () => {
    saveSession(stored);
    sessionStorage.clear();
    window.history.replaceState(null, "", "/room/1234");
    vi.stubGlobal("fetch", ok());
    renderProvider();
    expect(await screen.findByText("in 1234")).toBeInTheDocument();
  });

  it("at / restores this tab's last room and navigates to it", async () => {
    saveSession(stored);
    vi.stubGlobal("fetch", ok());
    renderProvider();
    expect(await screen.findByText("in 1234")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/room/1234");
  });

  it("drops the stored session on 401 and stays on the room URL", async () => {
    saveSession(stored);
    window.history.replaceState(null, "", "/room/1234");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ code: "UNAUTHORIZED" }), { status: 401 }),
    ));
    renderProvider();
    expect(await screen.findByText("none")).toBeInTheDocument();
    await waitFor(() => expect(loadSession("1234")).toBeNull());
    expect(loadLocalSession("1234")).toBeNull();
    expect(window.location.pathname).toBe("/room/1234");
  });

  it("starts without a session when nothing is stored", () => {
    renderProvider();
    expect(screen.getByText("none")).toBeInTheDocument();
  });

  it("leave('kicked') clears the session, goes to / and exposes the notice", async () => {
    saveSession(stored);
    window.history.replaceState(null, "", "/room/1234");
    vi.stubGlobal("fetch", ok());
    renderProvider();
    expect(await screen.findByText("in 1234")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "kick" }).click());
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.getByText("notice: kicked")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    expect(loadSession("1234")).toBeNull();
  });
});
