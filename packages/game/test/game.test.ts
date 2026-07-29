import { describe, expect, it } from "vitest";
import {
  chooseCharacter,
  createGame,
  joinGame,
  setPlayerReady,
} from "../src/game.js";
import type { Player } from "../src/types.js";

const host: Player = {
  id: "player-1" as Player["id"],
  name: "Ada",
  isReady: false,
};

function gameWithHost() {
  return createGame("game-1" as never, "MIST-42" as never, host);
}

describe("joinGame", () => {
  it("adds a distinct player without mutating the existing game", () => {
    const game = gameWithHost();
    const player: Player = {
      id: "player-2" as Player["id"],
      name: "Jan",
      isReady: false,
    };

    const result = joinGame(game, player);

    expect(result).toEqual({
      ok: true,
      game: expect.objectContaining({ players: [host, player] }),
    });
    expect(game.players).toEqual([host]);
  });

  it("rejects a player already present in the game", () => {
    const game = gameWithHost();

    expect(joinGame(game, host)).toEqual({
      ok: false,
      reason: "PLAYER_ALREADY_JOINED",
    });
  });

  it("rejects a player when the lobby is full", () => {
    const game = createGame("game-1" as never, "MIST-42" as never, host, 3);
    const second = joinGame(game, {
      id: "player-2" as Player["id"],
      name: "Jan",
      isReady: false,
    });
    const fullGame = second.ok ? second.game : game;

    const third = joinGame(fullGame, {
      id: "player-3" as Player["id"],
      name: "Ola",
      isReady: false,
    });
    const result = third.ok
      ? joinGame(third.game, {
          id: "player-4" as Player["id"],
          name: "Mia",
          isReady: false,
        })
      : third;

    expect(result).toEqual({ ok: false, reason: "GAME_FULL" });
  });

  it("assigns an available character and clears ready status", () => {
    const result = chooseCharacter(gameWithHost(), host.id, "orchid");

    expect(result).toEqual({
      ok: true,
      game: expect.objectContaining({
        players: [
          expect.objectContaining({ characterId: "orchid", isReady: false }),
        ],
      }),
    });
  });

  it("prevents selecting a character claimed by another player", () => {
    const joined = joinGame(gameWithHost(), {
      id: "player-2" as Player["id"],
      name: "Jan",
      isReady: false,
    });
    const game = joined.ok ? joined.game : gameWithHost();
    const chosen = chooseCharacter(game, host.id, "plum");
    const withPlum = chosen.ok ? chosen.game : game;

    expect(
      chooseCharacter(withPlum, "player-2" as Player["id"], "plum"),
    ).toEqual({
      ok: false,
      reason: "CHARACTER_TAKEN",
    });
  });

  it("requires a character before a player can be ready", () => {
    expect(setPlayerReady(gameWithHost(), host.id, true)).toEqual({
      ok: false,
      reason: "GAME_NOT_READY",
    });
  });
});
