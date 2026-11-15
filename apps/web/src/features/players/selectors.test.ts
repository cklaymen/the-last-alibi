import { describe, expect, it } from "vitest";
import { makeGame } from "../game/testFixtures.js";
import { isMyTurn, myPlayer, orderedPlayers, playerName, pluralCategory } from "./selectors.js";

describe("player selectors", () => {
  it("orders players by turn order", () => {
    const game = makeGame({ turnOrder: ["p3", "p1", "p2"] });
    expect(orderedPlayers(game).map((p) => p.name)).toEqual(["Cleo", "Alice", "Bob"]);
  });

  it("resolves names and falls back to the id", () => {
    const game = makeGame();
    expect(playerName(game, "p2")).toBe("Bob");
    expect(playerName(game, "nobody")).toBe("nobody");
    expect(myPlayer(game, "p3")?.characterId).toBe("blue");
  });

  it("knows whose turn it is", () => {
    const game = makeGame();
    expect(isMyTurn(game, "p1")).toBe(true);
    expect(isMyTurn(game, "p2")).toBe(false);
    expect(isMyTurn({ ...game, status: "FINISHED" }, "p1")).toBe(false);
  });

  it("picks Polish plural forms", () => {
    expect([1, 2, 4, 5, 9, 12, 22, 25].map((n) => pluralCategory(n, "pl"))).toEqual([
      "one", "few", "few", "many", "many", "many", "few", "many",
    ]);
    expect(pluralCategory(1, "en")).toBe("one");
    expect(pluralCategory(3, "en")).toBe("many");
  });
});
