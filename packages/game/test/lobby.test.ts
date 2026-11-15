import { describe, expect, it } from "vitest";
import {
  chooseCharacter,
  createGame,
  gameId,
  joinGame,
  playerId,
  restartGame,
  roomCode,
} from "../src/index.js";
import { codeOf, lobbyWith, pid, started, unwrap, withState } from "./helpers.js";

const host = { id: playerId("h"), name: "Host" };

describe("lobby", () => {
  it("createGame starts in LOBBY with the host", () => {
    const g = createGame(gameId("g"), roomCode("R"), host);
    expect(g).toEqual({
      id: "g",
      roomCode: "R",
      hostId: "h",
      maxPlayers: 6,
      phase: "LOBBY",
      players: [host],
      play: null,
    });
  });

  it("joinGame adds players and rejects duplicates, full rooms and started games", () => {
    let g = createGame(gameId("g"), roomCode("R"), host);
    expect(codeOf(joinGame(g, host))).toBe("PLAYER_ALREADY_JOINED");
    for (let i = 0; i < 5; i++) g = unwrap(joinGame(g, { id: playerId(`p${i}`), name: `P${i}` }));
    expect(g.players).toHaveLength(6);
    expect(codeOf(joinGame(g, { id: playerId("x"), name: "X" }))).toBe("GAME_FULL");
    const s = started(["red", "blue"]);
    expect(codeOf(joinGame(s, { id: playerId("x"), name: "X" }))).toBe("GAME_NOT_IN_LOBBY");
  });

  it("joinGame does not mutate the original game", () => {
    const g = createGame(gameId("g"), roomCode("R"), host);
    unwrap(joinGame(g, { id: playerId("x"), name: "X" }));
    expect(g.players).toHaveLength(1);
  });

  it("chooseCharacter assigns, allows re-choosing own and switching, rejects taken", () => {
    let g = lobbyWith(["red", "blue"]);
    expect(g.players.map((p) => p.characterId)).toEqual(["red", "blue"]);
    expect(codeOf(chooseCharacter(g, pid("blue"), "red"))).toBe("CHARACTER_TAKEN");
    expect(codeOf(chooseCharacter(g, pid("red"), "red"))).toBe("OK");
    g = unwrap(chooseCharacter(g, pid("red"), "green"));
    expect(g.players[0]?.characterId).toBe("green");
    expect(codeOf(chooseCharacter(g, pid("blue"), "red"))).toBe("OK");
    expect(codeOf(chooseCharacter(g, playerId("nobody"), "white"))).toBe("PLAYER_NOT_FOUND");
    expect(codeOf(chooseCharacter(started(["red", "blue"]), pid("red"), "white"))).toBe(
      "GAME_NOT_IN_LOBBY",
    );
  });

  it("restartGame: host only, FINISHED only, keeps players and characters", () => {
    const s = started(["red", "blue"]);
    expect(codeOf(restartGame(s, pid("red"), gameId("g2")))).toBe("GAME_NOT_FINISHED");
    const finished = { ...withState(s, {}), phase: "FINISHED" as const };
    expect(codeOf(restartGame(finished, pid("blue"), gameId("g2")))).toBe("NOT_HOST");
    const r = unwrap(restartGame(finished, pid("red"), gameId("g2")));
    expect(r.id).toBe("g2");
    expect(r.phase).toBe("LOBBY");
    expect(r.play).toBeNull();
    expect(r.players).toEqual(s.players);
    expect(r.roomCode).toBe(s.roomCode);
  });
});
