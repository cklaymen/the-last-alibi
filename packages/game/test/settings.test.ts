import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SETTINGS,
  MAX_ROOM_CARDS,
  createGame,
  disproveTimeLimits,
  gameId,
  makeAccusation,
  playerId,
  returnToLobby,
  roomCode,
  startGame,
  turnTimeLimits,
  updateSettings,
  type RoomSettings,
} from "../src/index.js";
import { codeOf, constRng, lobbyWith, pid, started, unwrap } from "./helpers.js";

describe("room settings", () => {
  it("createGame uses DEFAULT_ROOM_SETTINGS", () => {
    const game = createGame(gameId("g"), roomCode("R"), { id: playerId("h"), name: "Host" });
    expect(game.settings).toEqual({
      accusationPlace: "any_room",
      accuseAfterSuggestion: true,
      suggestAfterStaying: false,
      turnTimeLimitSec: 90,
      disproveTimeLimitSec: 30,
      roomCards: 0,
      autoNotes: true,
    });
    expect(game.settings).toEqual(DEFAULT_ROOM_SETTINGS);
  });

  it("exposes the option lists", () => {
    expect(turnTimeLimits).toEqual([null, 30, 60, 90, 120, 180]);
    expect(disproveTimeLimits).toEqual([null, 15, 30, 45, 60]);
    expect(MAX_ROOM_CARDS).toBe(8);
  });

  it("host updates settings in lobby", () => {
    const g = lobbyWith(["red", "blue"]);
    const r = unwrap(updateSettings(g, pid("red"), { turnTimeLimitSec: 30 }));
    expect(r.settings).toEqual({ ...DEFAULT_ROOM_SETTINGS, turnTimeLimitSec: 30 });
  });

  it("accepts every valid value", () => {
    const g = lobbyWith(["red", "blue"]);
    const r = unwrap(
      updateSettings(g, pid("red"), {
        accusationPlace: "named_room",
        accuseAfterSuggestion: false,
        suggestAfterStaying: true,
        turnTimeLimitSec: null,
        disproveTimeLimitSec: null,
        roomCards: 8,
        autoNotes: false,
      }),
    );
    expect(r.settings).toEqual({
      accusationPlace: "named_room",
      accuseAfterSuggestion: false,
      suggestAfterStaying: true,
      turnTimeLimitSec: null,
      disproveTimeLimitSec: null,
      roomCards: 8,
      autoNotes: false,
    });
  });

  it("non-host is rejected", () => {
    const g = lobbyWith(["red", "blue"]);
    expect(codeOf(updateSettings(g, pid("blue"), { roomCards: 2 }))).toBe("NOT_HOST");
  });

  it("after start is rejected", () => {
    const g = started(["red", "blue"]);
    expect(codeOf(updateSettings(g, pid("red"), { roomCards: 2 }))).toBe("GAME_NOT_IN_LOBBY");
  });

  it("invalid values are rejected", () => {
    const g = lobbyWith(["red", "blue"]);
    const bad = [
      { turnTimeLimitSec: 45 },
      { disproveTimeLimitSec: 90 },
      { roomCards: 9 },
      { roomCards: 1.5 },
      { roomCards: -1 },
      { accusationPlace: "hall" },
      { autoNotes: "yes" },
    ] as const;
    for (const patch of bad) {
      const unchecked = patch as unknown as Partial<RoomSettings>;
      expect(codeOf(updateSettings(g, pid("red"), unchecked))).toBe("INVALID_SETTINGS");
    }
  });

  it("settings survive returnToLobby", () => {
    const lobby = unwrap(updateSettings(lobbyWith(["red", "blue"]), pid("red"), { roomCards: 3 }));
    const s = unwrap(startGame(lobby, lobby.hostId, constRng(0)));
    const finished = unwrap(makeAccusation(s, pid("red"), s.play!.envelope));
    const r = unwrap(returnToLobby(finished, gameId("g2")));
    expect(r.settings).toEqual({ ...DEFAULT_ROOM_SETTINGS, roomCards: 3 });
  });

  it("startGame initialises roomCards to {}", () => {
    const g = started(["red", "blue"]);
    expect(g.play!.roomCards).toEqual({});
  });
});
