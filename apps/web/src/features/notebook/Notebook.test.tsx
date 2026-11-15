import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testGame, testMe } from "../../test/renderWithGame.js";
import { act } from "react";
import { Notebook } from "./Notebook.js";
import { useNotebookMarks } from "./useNotebook.js";
import { updateNotebook } from "./notebookStore.js";
import { cycle, notebookKey } from "./notebookModel.js";

function MarksProbe() {
  const markOf = useNotebookMarks();
  return <output aria-label="probe">{`${markOf("hall")},${markOf("red")}`}</output>;
}

describe("Notebook", () => {
  it("pre-marks own cards and cycles a cell", async () => {
    renderWithGame(<Notebook />);
    const region = screen.getByRole("region", { name: "Notebook" });
    expect(within(region).getByRole("button", { name: "Ms. Red: has" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Rope: has" })).toBeInTheDocument();
    await userEvent.click(within(region).getByRole("button", { name: "Hall: empty" }));
    await userEvent.click(within(region).getByRole("button", { name: "Hall: has" }));
    expect(within(region).getByRole("button", { name: "Hall: not" })).toBeInTheDocument();
  });

  it("auto-marks newly seen cards and persists across remounts", async () => {
    const { rerenderWith, unmount } = renderWithGame(<Notebook />);
    rerenderWith({ me: { ...testMe, seenCards: [{ cardId: "study", fromPlayerId: "p2" }] } });
    expect(screen.getByRole("button", { name: "Study: has" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lounge: empty" }));
    unmount();
    renderWithGame(<Notebook />);
    expect(screen.getByRole("button", { name: "Lounge: has" })).toBeInTheDocument();
  });

  it("starts fresh for a new game id", async () => {
    const { unmount } = renderWithGame(<Notebook />);
    await userEvent.click(screen.getByRole("button", { name: "Lounge: empty" }));
    unmount();
    renderWithGame(<Notebook />, {
      game: { ...testGame, gameId: "game-2" },
      me: { ...testMe, gameId: "game-2", hand: [] },
    });
    expect(screen.getByRole("button", { name: "Lounge: empty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ms. Red: empty" })).toBeInTheDocument();
  });

  it("shows the card icon or avatar in every cell", () => {
    renderWithGame(<Notebook />);
    const red = screen.getByRole("button", { name: "Ms. Red: has" });
    expect(red.querySelector('[data-card-icon="red"]')).not.toBeNull();
    const rope = screen.getByRole("button", { name: "Rope: has" });
    expect(rope.querySelector('svg[data-card-icon="rope"]')).not.toBeNull();
    const hall = screen.getByRole("button", { name: "Hall: empty" });
    expect(hall.querySelector('svg[data-card-icon="hall"]')).not.toBeNull();
    expect(screen.getByRole("region", { name: "Notebook" }).querySelectorAll("[data-card-icon]")).toHaveLength(21);
  });

  it("useNotebookMarks stays in sync with the notebook", async () => {
    renderWithGame(
      <>
        <Notebook />
        <MarksProbe />
      </>,
    );
    const probe = screen.getByRole("status", { name: "probe" });
    expect(probe).toHaveTextContent("empty,has");
    await userEvent.click(screen.getByRole("button", { name: "Hall: empty" }));
    expect(probe).toHaveTextContent("has,has");
    act(() => updateNotebook(notebookKey(testGame.gameId, "p1"), (s) => cycle(s, "hall")));
    expect(probe).toHaveTextContent("not,has");
    expect(screen.getByRole("button", { name: "Hall: not" })).toBeInTheDocument();
  });
});
