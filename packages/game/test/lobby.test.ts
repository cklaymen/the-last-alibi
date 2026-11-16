import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SETTINGS,
  chooseCharacter,
  createGame,
  gameId,
  joinGame,
  playerId,
  kickPlayer,
  makeAccusation,
  removePlayer,
  renamePlayer,
  returnToLobby,
  roomCode,
} from "../src/index.js";
import { codeOf, lobbyWith, pid, started, unwrap } from "./helpers.js";

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
      lastResult: null,
      settings: DEFAULT_ROOM_SETTINGS,
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

  it("joinGame rejects a nickname already used in the room (case-insensitive)", () => {
    const g = createGame(gameId("g"), roomCode("R"), host);
    expect(codeOf(joinGame(g, { id: playerId("x"), name: " host " }))).toBe("NAME_TAKEN");
  });

  it("renamePlayer changes the name in any phase, but never to a taken one", () => {
    const s = started(["red", "blue"]);
    const r = unwrap(renamePlayer(s, pid("red"), "  Ada  "));
    expect(r.players.find((p) => p.id === pid("red"))?.name).toBe("Ada");
    expect(codeOf(renamePlayer(r, pid("blue"), "ADA"))).toBe("NAME_TAKEN");
    expect(unwrap(renamePlayer(r, pid("red"), "ada")).players[0]?.name).toBe("ada");
    expect(codeOf(renamePlayer(r, playerId("nobody"), "Zed"))).toBe("PLAYER_NOT_FOUND");
  });

  it("removePlayer works only in the lobby and passes the host role on", () => {
    const l = lobbyWith(["red", "blue", "green"]);
    const r = unwrap(removePlayer(l, l.hostId));
    expect(r.players).toHaveLength(2);
    expect(r.hostId).toBe(r.players[0]?.id);
    const other = unwrap(removePlayer(l, pid("green")));
    expect(other.hostId).toBe(l.hostId);
    expect(codeOf(removePlayer(l, playerId("nobody")))).toBe("PLAYER_NOT_FOUND");
    expect(codeOf(removePlayer(started(["red", "blue"]), pid("blue")))).toBe("GAME_NOT_IN_LOBBY");
  });

  it("kickPlayer: host only, not self, lobby only", () => {
    const l = lobbyWith(["red", "blue"]);
    const guest = l.players.find((p) => p.id !== l.hostId)!.id;
    expect(codeOf(kickPlayer(l, guest, l.hostId))).toBe("NOT_HOST");
    expect(codeOf(kickPlayer(l, l.hostId, l.hostId))).toBe("CANNOT_KICK_SELF");
    expect(unwrap(kickPlayer(l, l.hostId, guest)).players.map((p) => p.id)).toEqual([l.hostId]);
  });

  it("returnToLobby: a finished game goes back to the lobby with the last result", () => {
    const s = started(["red", "blue"]);
    expect(codeOf(returnToLobby(s, gameId("g2")))).toBe("GAME_NOT_FINISHED");
    const envelope = s.play!.envelope;
    const finished = unwrap(makeAccusation(s, pid("red"), envelope));
    const r = unwrap(returnToLobby(finished, gameId("g2")));
    expect(r.id).toBe("g2");
    expect(r.phase).toBe("LOBBY");
    expect(r.play).toBeNull();
    expect(r.players).toEqual(s.players);
    expect(r.lastResult).toEqual({
      winnerId: pid("red"),
      winnerName: s.players.find((p) => p.id === pid("red"))!.name,
      reason: "ACCUSATION",
      envelope,
    });
  });
});
