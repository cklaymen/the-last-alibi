import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "../session/index.js";
import { NICKNAME_KEY } from "../nickname/index.js";
import { JoinRoomScreen } from "./JoinRoomScreen.js";
import { JoinScreen } from "./JoinScreen.js";

const room = {
  id: "g", code: "1234", hostId: "p0", maxPlayers: 6, phase: "LOBBY", lastResult: null,
  players: [{ id: "p1", name: "Ada", presence: "online" }],
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function renderAt(ui: React.ReactElement, path = "/room/1234") {
  window.history.replaceState(null, "", path);
  return render(<SessionProvider>{ui}</SessionProvider>);
}

describe("JoinRoomScreen (join by link)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("pre-fills the remembered nickname and joins the room from the URL", async () => {
    localStorage.setItem(NICKNAME_KEY, "Ada");
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.endsWith("/rooms/join")
        ? json({ room, session: { playerId: "p1", token: "t" } })
        : json({ code: "1234" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderAt(<JoinRoomScreen code="1234" />);

    expect(screen.getByRole("heading", { name: "Join room 1234" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Your nickname" })).toHaveValue("Ada");
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/rooms\/1234$/);

    await user.click(screen.getByRole("button", { name: "Join room" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, init] = fetchMock.mock.calls[1]!;
    expect(JSON.parse(init!.body as string)).toEqual({ playerName: "Ada", roomCode: "1234" });
    expect(window.location.pathname).toBe("/room/1234");
    expect(localStorage.getItem(NICKNAME_KEY)).toBe("Ada");
  });

  it("shows ROOM_NOT_FOUND up front and disables joining", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ code: "ROOM_NOT_FOUND" }, 404)));
    renderAt(<JoinRoomScreen code="1234" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This room does not exist.");
    expect(screen.getByRole("button", { name: "Join room" })).toBeDisabled();
  });

  it("'Create a new room instead' goes to /", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({})));
    const user = userEvent.setup();
    renderAt(<JoinRoomScreen code="1234" />);
    await user.click(screen.getByRole("button", { name: "Create a new room instead" }));
    expect(window.location.pathname).toBe("/");
  });
});

describe("JoinScreen (home)", () => {
  it("pre-fills the remembered nickname", () => {
    localStorage.setItem(NICKNAME_KEY, "Ada");
    renderAt(<JoinScreen />, "/");
    expect(screen.getByRole("textbox", { name: "Your nickname" })).toHaveValue("Ada");
  });
});
