import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { makeGame } from "../game/testFixtures.js";
import { PlayersBar } from "./PlayersBar.js";

describe("PlayersBar", () => {
  it("shows offline / away badges for players who are not online", () => {
    const game = makeGame();
    game.players[1] = { ...game.players[1]!, presence: "offline" };
    game.players[2] = { ...game.players[2]!, presence: "away" };
    render(<PlayersBar game={game} myId="p1" />);
    const items = within(screen.getByRole("region", { name: "Players" })).getAllByRole("listitem");
    expect(within(items[0]!).queryByText(/^(offline|away)$/)).toBeNull();
    expect(within(items[1]!).getByText("offline")).toBeInTheDocument();
    expect(within(items[2]!).getByText("away")).toBeInTheDocument();
  });
});
