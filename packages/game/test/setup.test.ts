import { describe, expect, it } from "vitest";
import {
  START_POSITIONS,
  characterIds,
  createGame,
  gameId,
  joinGame,
  playerId,
  roomCode,
  roomIds,
  startGame,
  weaponIds,
  type CharacterId,
} from "../src/index.js";
import { codeOf, constRng, lobbyWith, pid, play, seqRng, started, unwrap } from "./helpers.js";

const ALL = [...characterIds];
const rngs = [constRng(0), constRng(0.999), seqRng([0.13, 0.71, 0.42, 0.9, 0.05, 0.33, 0.58])];

describe("startGame guards", () => {
  it("rejects non-host, too few players, missing characters, already started", () => {
    const lobby = lobbyWith(["red", "blue"]);
    expect(codeOf(startGame(lobby, pid("blue"), constRng()))).toBe("NOT_HOST");
    const solo = lobbyWith(["red"]);
    expect(codeOf(startGame(solo, pid("red"), constRng()))).toBe("NOT_ENOUGH_PLAYERS");
    let noChar = createGame(gameId("g"), roomCode("R"), { id: playerId("a"), name: "A" });
    noChar = unwrap(joinGame(noChar, { id: playerId("b"), name: "B" }));
    expect(codeOf(startGame(noChar, playerId("a"), constRng()))).toBe("CHARACTER_REQUIRED");
    const s = unwrap(startGame(lobby, pid("red"), constRng()));
    expect(codeOf(startGame(s, pid("red"), constRng()))).toBe("GAME_NOT_IN_LOBBY");
  });
});

describe("startGame state", () => {
  it("initial play state", () => {
    const g = started(["blue", "red"]);
    const p = play(g);
    expect(g.phase).toBe("IN_PROGRESS");
    expect(p.events).toEqual([{ type: "game_started", firstPlayerId: pid("red") }]);
    expect(p.turn).toEqual({
      playerId: pid("red"),
      dice: null,
      hasMoved: false,
      leftRoom: null,
      suggestionRoom: null,
      hasSuggested: false,
      pendingSuggestion: null,
    });
    expect(p.eliminated).toEqual([]);
    expect(p.summonedTo).toEqual({});
    expect(p.reveals).toEqual([]);
    expect(p.winner).toBeNull();
  });

  it("places all six pawns on start positions, including unplayed characters", () => {
    const p = play(started(["green", "purple"]));
    for (const c of characterIds)
      expect(p.pawns[c]).toEqual({ kind: "cell", position: START_POSITIONS[c] });
  });

  it.each(rngs.map((r, i) => [i, r] as const))("weapons in six different rooms (rng %i)", (_, rng) => {
    const p = play(started(["red", "blue"], rng));
    const rooms = weaponIds.map((w) => p.weapons[w]);
    expect(new Set(rooms).size).toBe(6);
    for (const r of rooms) expect(roomIds).toContain(r);
  });

  it("turn order follows SEAT_ORDER with red first and unplayed skipped", () => {
    expect(play(started(["purple", "white", "red", "blue"])).turnOrder).toEqual(
      ["red", "white", "blue", "purple"].map((c) => pid(c as CharacterId)),
    );
    expect(play(started(["blue", "yellow"])).turnOrder).toEqual([pid("yellow"), pid("blue")]);
    expect(play(started(["purple", "green"])).turn.playerId).toBe(pid("green"));
  });

  it.each([2, 3, 4, 5, 6])("deals all 18 cards round-robin for %i players", (n) => {
    for (const rng of rngs) {
      const chars = ALL.slice(0, n);
      const p = play(started(chars, rng));
      const sizes = p.turnOrder.map((id) => p.hands[id]?.length ?? 0);
      const base = Math.floor(18 / n);
      const extra = 18 % n;
      expect(sizes).toEqual(p.turnOrder.map((_, i) => base + (i < extra ? 1 : 0)));
      const dealt = Object.values(p.hands).flat();
      expect(dealt).toHaveLength(18);
      const env = [p.envelope.suspect, p.envelope.weapon, p.envelope.room];
      for (const c of env) expect(dealt).not.toContain(c);
      expect(new Set([...dealt, ...env])).toEqual(
        new Set([...characterIds, ...weaponIds, ...roomIds]),
      );
    }
  });

  it("2 players get 9/9", () => {
    const p = play(started(["red", "white"]));
    expect(p.turnOrder.map((id) => p.hands[id]?.length)).toEqual([9, 9]);
  });

  it("envelope has one card of each kind and is deterministic for a given rng", () => {
    const a = play(started(["red", "white"], seqRng([0.5, 0.2, 0.8, 0.1])));
    const b = play(started(["red", "white"], seqRng([0.5, 0.2, 0.8, 0.1])));
    expect(a).toEqual(b);
    expect(characterIds).toContain(a.envelope.suspect);
    expect(weaponIds).toContain(a.envelope.weapon);
    expect(roomIds).toContain(a.envelope.room);
    const c = play(started(["red", "white"], constRng(0.999)));
    expect(c.envelope).not.toEqual(play(started(["red", "white"], constRng(0))).envelope);
  });
});
