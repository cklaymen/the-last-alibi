import { describe, expect, it } from "vitest";
import { roomsVisitedBy, visibleRoomCards, type GameEvent } from "../src/index.js";
import { cell, pid, room, started, withState } from "./helpers.js";

const base = () => started(["red", "white", "blue"]);

describe("roomsVisitedBy", () => {
  it("is empty at game start (all pawns on start cells)", () => {
    const g = base();
    expect(roomsVisitedBy(g, pid("red"))).toEqual([]);
  });

  it("includes moved, passage and summoned rooms, deduplicated", () => {
    const events: GameEvent[] = [
      { type: "game_started", firstPlayerId: pid("red") },
      { type: "moved", playerId: pid("red"), to: room("kitchen") },
      { type: "moved", playerId: pid("red"), to: cell(5, 5) },
      { type: "passage_used", playerId: pid("red"), from: "kitchen", to: "study" },
      { type: "moved", playerId: pid("red"), to: room("kitchen") },
      // white summons red's character to the ballroom
      {
        type: "suggested",
        playerId: pid("white"),
        suggestion: { suspect: "red", weapon: "rope", room: "ballroom" },
      },
      // other players' movement does not count for red
      { type: "moved", playerId: pid("white"), to: room("library") },
      { type: "passage_used", playerId: pid("blue"), from: "lounge", to: "conservatory" },
      {
        type: "suggested",
        playerId: pid("red"),
        suggestion: { suspect: "blue", weapon: "rope", room: "hall" },
      },
    ];
    const g = withState(base(), { events, pawns: { red: room("ballroom") } });
    const visited = roomsVisitedBy(g, pid("red"));
    expect([...visited].sort()).toEqual(["ballroom", "kitchen", "study"]);
    expect([...roomsVisitedBy(g, pid("blue"))].sort()).toEqual(["conservatory", "hall"]);
  });

  it("includes the pawn's current room even without events", () => {
    const g = withState(base(), { pawns: { white: room("lounge") } });
    expect(roomsVisitedBy(g, pid("white"))).toEqual(["lounge"]);
  });

  it("is empty for an unknown player or a game without play state", () => {
    const g = base();
    expect(roomsVisitedBy(g, pid("green"))).toEqual([]);
    expect(roomsVisitedBy({ ...g, play: null }, pid("red"))).toEqual([]);
  });
});

describe("visibleRoomCards", () => {
  it("only for visited rooms", () => {
    const events: GameEvent[] = [
      { type: "game_started", firstPlayerId: pid("red") },
      { type: "moved", playerId: pid("red"), to: room("kitchen") },
      { type: "passage_used", playerId: pid("red"), from: "kitchen", to: "study" },
    ];
    const g = withState(base(), {
      events,
      pawns: { red: room("study") },
      roomCards: { kitchen: "dagger", hall: "lounge", study: "white" },
    });
    expect(visibleRoomCards(g, pid("red"))).toEqual(
      expect.arrayContaining([
        { roomId: "kitchen", cardId: "dagger" },
        { roomId: "study", cardId: "white" },
      ]),
    );
    expect(visibleRoomCards(g, pid("red"))).toHaveLength(2);
    expect(visibleRoomCards(g, pid("white"))).toEqual([]);
  });

  it("is empty when there are no room cards", () => {
    const g = withState(base(), { pawns: { red: room("kitchen") } });
    expect(visibleRoomCards(g, pid("red"))).toEqual([]);
  });
});
