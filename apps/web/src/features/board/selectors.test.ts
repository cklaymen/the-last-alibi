import type { GameEvent } from "@mystery-game/contracts";
import { describe, expect, it } from "vitest";
import { makeGame } from "../game/testFixtures.js";
import { boardHighlights, myLocation, myRoom, placePawns, placeWeapons, roomSlots } from "./selectors.js";

describe("board selectors", () => {
  it("lists pawns and weapons per room in canonical order", () => {
    const slots = roomSlots(makeGame());
    expect(slots.kitchen).toEqual({ pawns: ["white", "blue"], weapons: ["candlestick", "revolver"] });
    expect(slots.study).toEqual({ pawns: [], weapons: ["wrench"] });
    expect(slots.hall).toBeUndefined();
  });

  it("places pawns sharing a room on different points", () => {
    const placed = placePawns(makeGame());
    expect(placed).toHaveLength(6);
    const white = placed.find((p) => p.characterId === "white")!;
    const blue = placed.find((p) => p.characterId === "blue")!;
    expect(white.point).not.toEqual(blue.point);
    const weapons = placeWeapons(makeGame());
    expect(weapons).toHaveLength(6);
    expect(new Set(weapons.map((w) => `${w.point.x},${w.point.y}`)).size).toBe(6);
  });

  it("finds my location and room", () => {
    const game = makeGame();
    expect(myLocation(game, "p1")).toEqual({ kind: "cell", position: { row: 24, col: 7 } });
    expect(myRoom(game, "p1")).toBeNull();
    expect(myRoom(game, "p2")).toBe("kitchen");
  });
});

describe("boardHighlights", () => {
  const suggested: GameEvent = { type: "suggested", playerId: "p1", suggestion: { suspect: "green", weapon: "rope", room: "hall" } };
  const ev = (events: GameEvent[]) => events.map((event, seq) => ({ seq, event }));

  it("marks the active player's pawn and nothing else without a suggestion", () => {
    expect(boardHighlights(makeGame())).toEqual({
      activeCharacter: "red",
      suggestedCharacter: null,
      suggestedWeapon: null,
      suggestedRoom: null,
    });
    expect(boardHighlights(makeGame({ status: "FINISHED" })).activeCharacter).toBeNull();
  });

  it("marks the current suggestion until turn_ended", () => {
    const during = makeGame({ events: ev([suggested]) });
    expect(boardHighlights(during)).toMatchObject({ suggestedCharacter: "green", suggestedWeapon: "rope", suggestedRoom: "hall" });
    const after = makeGame({ events: ev([suggested, { type: "turn_ended", playerId: "p1" }]) });
    expect(boardHighlights(after).suggestedCharacter).toBeNull();
  });
});
