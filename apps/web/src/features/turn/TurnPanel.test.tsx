import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGame, makeMe, makeSettings } from "../game/testFixtures.js";
import { visibleActions, turnActions } from "./actions.js";
import { TurnPanel } from "./TurnPanel.js";

const ALL = ["Roll dice", "Secret passage", "Suggest", "Accuse", "End turn"];

describe("visibleActions", () => {
  it("keeps registry order and drops move/disprove", () => {
    expect(visibleActions(["end_turn", "move", "roll", "disprove"]).map((a) => a.id)).toEqual([
      "roll",
      "end_turn",
    ]);
    expect(turnActions.map((a) => a.id)).not.toContain("move");
  });
});

describe("TurnPanel", () => {
  it("shows only the actions the server allows", () => {
    const send = vi.fn();
    render(
      <TurnPanel game={makeGame()} me={makeMe({ availableActions: ["roll", "accuse"] })} myId="p1" send={send} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Your turn");
    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Roll dice", "Accuse"]);
    for (const n of ALL.filter((x) => !names.includes(x)))
      expect(screen.queryByRole("button", { name: n })).toBeNull();
  });

  it("sends a roll and shows the dice for the active player", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, code: "NOT_YOUR_TURN" });
    const { rerender } = render(
      <TurnPanel game={makeGame()} me={makeMe({ availableActions: ["roll"] })} myId="p1" send={send} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Roll dice" }));
    expect(send).toHaveBeenCalledWith("turn:roll", {});
    expect(await screen.findByRole("alert")).toHaveTextContent("It is not your turn.");

    const rolled = makeGame({ turn: { playerId: "p1", dice: [3, 4], hasMoved: false, pendingSuggestion: null } });
    rerender(<TurnPanel game={rolled} me={makeMe({ availableActions: ["move", "end_turn"] })} myId="p1" send={send} />);
    expect(screen.getByText("You rolled 3 + 4 = 7")).toBeInTheDocument();
    expect(screen.getByText("Choose where to move on the board.")).toBeInTheDocument();
  });

  it("shows another player's turn and the disprove wait", () => {
    const game = makeGame({
      turn: {
        playerId: "p2",
        dice: null,
        hasMoved: true,
        pendingSuggestion: {
          suggesterId: "p2",
          suggestion: { suspect: "red", weapon: "rope", room: "kitchen" },
          disproverId: "p3",
        },
      },
    });
    render(<TurnPanel game={game} me={makeMe()} myId="p1" send={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Bob's turn");
    expect(screen.getByText("Waiting for Cleo to show a card…")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("opens the suggestion dialog for the room I am in", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const game = makeGame({ turn: { playerId: "p2", dice: null, hasMoved: true, pendingSuggestion: null } });
    render(<TurnPanel game={game} me={makeMe({ playerId: "p2", availableActions: ["suggest"] })} myId="p2" send={send} />);
    const opener = screen.getByRole("button", { name: "Suggest" });
    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Make a suggestion" });
    expect(dialog).toHaveTextContent("Kitchen");
    const confirm = screen.getByRole("button", { name: "Confirm suggestion" });
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "Prof. Purple" }));
    await userEvent.click(screen.getByRole("radio", { name: "Dagger" }));
    await userEvent.click(confirm);
    expect(send).toHaveBeenCalledWith("turn:suggest", { suspect: "purple", weapon: "dagger" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("accusation dialog requires all three and closes on Escape", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    render(<TurnPanel game={makeGame()} me={makeMe({ availableActions: ["accuse"] })} myId="p1" send={send} />);
    await userEvent.click(screen.getByRole("button", { name: "Accuse" }));
    const dialog = screen.getByRole("dialog", { name: "Make an accusation" });
    expect(dialog).toHaveTextContent("If you are wrong you are out");
    expect(screen.getAllByRole("radiogroup").map((g) => g.getAttribute("aria-label"))).toEqual([
      "Suspect",
      "Weapon",
      "Room",
    ]);
    const confirm = screen.getByRole("button", { name: "Confirm accusation" });
    await userEvent.click(screen.getByRole("radio", { name: "Ms. Red" }));
    await userEvent.click(screen.getByRole("radio", { name: "Rope" }));
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "Hall" }));
    expect(confirm).toBeEnabled();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("AccuseAction", () => {
  const inLounge = (accusationPlace: "any_room" | "named_room") =>
    makeGame({
      settings: makeSettings({ accusationPlace }),
      pawns: [{ characterId: "red", location: { kind: "room", roomId: "lounge" } }],
    });
  const me = makeMe({ availableActions: ["accuse"] });

  it("named room: the room is locked to the current room", async () => {
    render(<TurnPanel game={inLounge("named_room")} me={me} myId="p1" send={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Accuse" }));
    const rooms = screen.getByRole("radiogroup", { name: "Room" });
    const lounge = screen.getByRole("radio", { name: "Lounge" });
    expect(rooms).toContainElement(lounge);
    expect(lounge).toBeChecked();
    expect(lounge).toBeDisabled();
  });

  it("any room: the room is free to choose", async () => {
    render(<TurnPanel game={inLounge("any_room")} me={me} myId="p1" send={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Accuse" }));
    const lounge = screen.getByRole("radio", { name: "Lounge" });
    expect(lounge).not.toBeChecked();
    expect(lounge).toBeEnabled();
  });
});
