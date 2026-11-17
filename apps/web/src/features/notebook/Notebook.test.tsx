import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GameEvent } from "@mystery-game/contracts";
import { renderWithGame, testGame, testMe } from "../../test/renderWithGame.js";
import { Notebook } from "./Notebook.js";
import { useNotebookMarks } from "./useNotebook.js";
import { updateNotebook } from "./notebookStore.js";
import { cycleGeneral, notebookKey } from "./notebookModel.js";

function MarksProbe() {
  const markOf = useNotebookMarks();
  return <output aria-label="probe">{`${markOf("hall")},${markOf("red")}`}</output>;
}

const region = () => screen.getByRole("region", { name: "Cards" });
const cell = (name: string | RegExp) => within(region()).getByRole("button", { name });
const events = (list: GameEvent[]) => list.map((event, seq) => ({ seq, event }));

afterEach(() => vi.restoreAllMocks());

describe("Notebook", () => {
  it("hand row has an \"In your hand\" button with a tooltip", async () => {
    renderWithGame(<Notebook />);
    const buttons = within(region()).getAllByRole("button", { name: "In your hand" });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]!);
    expect(within(region()).getByRole("tooltip")).toHaveTextContent("In your hand");
  });

  it("hand rows are locked and ✓, other players ✗", () => {
    renderWithGame(<Notebook />);
    expect(within(region()).getByRole("img", { name: "Rope – Overall – has (in hand)" })).toBeInTheDocument();
    expect(within(region()).getByRole("img", { name: "Rope – Bob – not (in hand)" })).toBeInTheDocument();
    expect(within(region()).queryByRole("button", { name: /^Rope – / })).toBeNull();
    expect(region().querySelectorAll("tr[data-in-hand]")).toHaveLength(2);
  });

  it("cycles a manual cell and persists only manual marks under the v2 key", async () => {
    localStorage.setItem(`notebook:${testGame.gameId}:p1`, JSON.stringify({ marks: { hall: "not" }, auto: [] }));
    const { unmount } = renderWithGame(<Notebook />);
    await userEvent.click(cell("Hall – Bob – empty (automatic)"));
    await userEvent.click(cell("Hall – Bob – has (manual)"));
    expect(cell("Hall – Bob – not (manual)")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(notebookKey(testGame.gameId, "p1"))!)).toEqual({
      general: {},
      cells: { p2: { hall: "not" } },
    });
    unmount();
    renderWithGame(<Notebook />);
    expect(cell("Hall – Bob – not (manual)")).toBeInTheDocument();
    expect(cell("Hall – Overall – empty (automatic)")).toBeInTheDocument();
  });

  it("shows automatic deductions, and a manual mark wins", async () => {
    const game = {
      ...testGame,
      events: events([
        { type: "suggested", playerId: "p1", suggestion: { suspect: "green", weapon: "dagger", room: "hall" } },
        { type: "cannot_disprove", playerId: "p2" },
      ]),
    };
    renderWithGame(<Notebook />, { game });
    expect(cell("Hall – Bob – not (automatic)")).toBeInTheDocument();
    await userEvent.click(cell("Hall – Bob – not (automatic)"));
    expect(cell("Hall – Bob – has (manual)")).toBeInTheDocument();
  });

  it("shown-to-me cell has outline + aria-label", () => {
    renderWithGame(<Notebook />, { me: { ...testMe, seenCards: [{ cardId: "study", fromPlayerId: "p2" }] } });
    const shown = cell("Study – Bob – has (automatic) – shown to you");
    expect(shown.querySelector(".outline-2")).not.toBeNull();
  });

  it("autoNotes off shows no automatic marks except facts", () => {
    const game = {
      ...testGame,
      settings: { ...testGame.settings, autoNotes: false },
      events: events([
        { type: "suggested", playerId: "p1", suggestion: { suspect: "green", weapon: "dagger", room: "hall" } },
        { type: "cannot_disprove", playerId: "p2" },
      ]),
    };
    renderWithGame(<Notebook />, { game, me: { ...testMe, seenCards: [{ cardId: "study", fromPlayerId: "p2" }] } });
    expect(cell("Hall – Bob – empty (automatic)")).toBeInTheDocument();
    expect(cell(/^Study – Bob – has \(automatic\)/)).toBeInTheDocument();
  });

  it("columns toggle persists", async () => {
    const { unmount } = renderWithGame(<Notebook />);
    await userEvent.click(within(region()).getByRole("checkbox", { name: "Show player columns" }));
    expect(within(region()).queryByRole("button", { name: /– Bob –/ })).toBeNull();
    expect(localStorage.getItem("notebook:showPlayers")).toBe("0");
    unmount();
    renderWithGame(<Notebook />);
    expect(within(region()).getByRole("checkbox", { name: "Show player columns" })).not.toBeChecked();
  });

  it("works when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    renderWithGame(<Notebook />, { game: { ...testGame, gameId: "game-throw" } });
    await userEvent.click(cell("Lounge – Overall – empty (automatic)"));
    expect(cell("Lounge – Overall – has (manual)")).toBeInTheDocument();
  });

  it("eliminated player header greyed", () => {
    const game = { ...testGame, players: testGame.players.map((p) => (p.id === "p2" ? { ...p, eliminated: true } : p)) };
    renderWithGame(<Notebook />, { game });
    const header = within(region()).getAllByRole("button", { name: "Bob" })[0]!;
    expect(header).toHaveAttribute("data-eliminated", "true");
    expect(header.closest("th")).toHaveClass("opacity-50");
  });

  it("useNotebookMarks stays in sync with the notebook (manual wins, hand ✓)", async () => {
    renderWithGame(
      <>
        <Notebook />
        <MarksProbe />
      </>,
    );
    const probe = screen.getByRole("status", { name: "probe" });
    expect(probe).toHaveTextContent("empty,has");
    await userEvent.click(cell("Hall – Overall – empty (automatic)"));
    expect(probe).toHaveTextContent("has,has");
    act(() => updateNotebook(notebookKey(testGame.gameId, "p1"), (s) => cycleGeneral(s, "hall")));
    expect(probe).toHaveTextContent("not,has");
  });
});
