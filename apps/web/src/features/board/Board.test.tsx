import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGame, makeMe } from "../game/testFixtures.js";
import { Board } from "./Board.js";

describe("Board", () => {
  it("renders all six pawns and six weapons with accessible names", () => {
    render(<Board game={makeGame()} me={makeMe()} myId="p1" />);
    const board = screen.getByRole("region", { name: "Board" });
    const imgs = within(board).getAllByRole("img");
    const names = imgs.map((i) => i.getAttribute("aria-label"));
    expect(names).toEqual(
      expect.arrayContaining([
        "Ms. Red – corridor",
        "Col. Yellow – corridor",
        "Mrs. White – Kitchen",
        "Mr. Green – corridor",
        "Mrs. Blue – Kitchen",
        "Prof. Purple – corridor",
        "Candlestick – Kitchen",
        "Dagger – Ballroom",
        "Lead pipe – Conservatory",
        "Revolver – Kitchen",
        "Rope – Library",
        "Wrench – Study",
      ]),
    );
    expect(imgs).toHaveLength(12);
    expect(within(board).queryByRole("button", { name: /^Move to|^Enter/ })).toBeNull();
  });

  it("renders reachable destinations as buttons that send the move", async () => {
    const onMove = vi.fn();
    const me = makeMe({
      reachable: [
        { kind: "cell", position: { row: 23, col: 7 } },
        { kind: "room", roomId: "lounge" },
      ],
    });
    render(<Board game={makeGame()} me={me} myId="p1" onMove={onMove} />);

    await userEvent.click(screen.getByRole("button", { name: "Move to row 24, column 8" }));
    expect(onMove).toHaveBeenCalledWith({ kind: "cell", position: { row: 23, col: 7 } });

    const room = screen.getByRole("button", { name: "Enter Lounge" });
    room.focus();
    fireEvent.keyDown(room, { key: "Enter" });
    expect(onMove).toHaveBeenLastCalledWith({ kind: "room", roomId: "lounge" });
  });

  it("has zoom controls; reset is disabled until zoomed", async () => {
    render(<Board game={makeGame()} me={makeMe()} myId="p1" />);
    const reset = screen.getByRole("button", { name: "Reset zoom" });
    expect(reset).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(reset).toBeEnabled();
    await userEvent.click(reset);
    expect(reset).toBeDisabled();
  });
});
