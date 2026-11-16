import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { makeGame } from "../game/testFixtures.js";
import { PlayersBar } from "./PlayersBar.js";

const items = () => within(screen.getByRole("region", { name: "Players" })).getAllByRole("listitem");

describe("PlayersBar", () => {
  it("chip aria-label has full info", () => {
    const game = makeGame();
    game.players[1] = { ...game.players[1]!, presence: "offline", eliminated: true };
    game.players[2] = { ...game.players[2]!, presence: "away" };
    render(<PlayersBar game={game} myId="p1" />);
    const [me, second, third] = items();
    const p = game.players;
    expect(me).toHaveAccessibleName(new RegExp(`^${p[0]!.name} \\(you\\) – .+ – \\d+ cards?$`));
    expect(second).toHaveAccessibleName(new RegExp(`^${p[1]!.name} – .+ – \\d+ cards? – offline – eliminated$`));
    expect(third).toHaveAccessibleName(/ – away$/);
  });

  it("active chip has aria-current", () => {
    const game = makeGame();
    render(<PlayersBar game={game} myId="p1" />);
    const active = items().filter((li) => li.getAttribute("aria-current") === "true");
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAccessibleName(new RegExp(`^${game.players.find((p) => p.id === game.turn.playerId)!.name}`));
  });
});
