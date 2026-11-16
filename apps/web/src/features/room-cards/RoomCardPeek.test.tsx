import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeGame, makeMe } from "../game/testFixtures.js";
import { RoomCardPeek } from "./RoomCardPeek.js";

const me = makeMe({ roomCards: [{ roomId: "kitchen", cardId: "rope" }] });
const at = (location: { kind: "room"; roomId: "kitchen" | "hall" }) =>
  makeGame({ pawns: [{ characterId: "red", location }] });

describe("RoomCardPeek", () => {
  it("shows the card only when my pawn is in that room", () => {
    const { unmount } = render(<RoomCardPeek game={at({ kind: "room", roomId: "kitchen" })} me={me} myId="p1" />);
    const region = screen.getByRole("region", { name: "Face-down card" });
    expect(region).toHaveTextContent("Face-down card in this room:");
    expect(region).toHaveTextContent("Rope");
    unmount();

    render(<RoomCardPeek game={at({ kind: "room", roomId: "hall" })} me={me} myId="p1" />);
    expect(screen.queryByRole("region", { name: "Face-down card" })).toBeNull();
  });

  it("renders nothing without visible room cards", () => {
    render(<RoomCardPeek game={at({ kind: "room", roomId: "kitchen" })} me={makeMe()} myId="p1" />);
    expect(screen.queryByRole("region", { name: "Face-down card" })).toBeNull();
  });
});
