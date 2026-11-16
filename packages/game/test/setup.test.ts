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
  updateSettings,
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

describe("startGame room cards", () => {
  const startWith = (n: number, chars: readonly CharacterId[], rng = constRng(0)) => {
    const lobby = unwrap(updateSettings(lobbyWith(chars), pid(chars[0] as CharacterId), { roomCards: n }));
    return play(unwrap(startGame(lobby, lobby.hostId, rng)));
  };

  it("roomCards=0 deals as before", () => {
    const makers = [() => constRng(0), () => constRng(0.999), () => seqRng([0.13, 0.71, 0.42, 0.9])];
    for (const make of makers) {
      const a = startWith(0, ["red", "white", "blue"], make());
      const b = play(started(["red", "white", "blue"], make()));
      expect(a.roomCards).toEqual({});
      expect(a.hands).toEqual(b.hands);
      expect(a.envelope).toEqual(b.envelope);
      expect(a.weapons).toEqual(b.weapons);
    }
  });

  it.each(rngs.map((r, i) => [i, r] as const))(
    "roomCards=8: 8 distinct rooms, 10 dealt cards, all 21 accounted for, none in hands/envelope (rng %i)",
    (_, rng) => {
      const p = startWith(8, ["red", "white"], rng);
      const entries = Object.entries(p.roomCards);
      expect(entries).toHaveLength(8);
      for (const [roomId] of entries) expect(roomIds).toContain(roomId);
      const roomCardIds = entries.map(([, c]) => c);
      expect(new Set(roomCardIds).size).toBe(8);
      const dealt = Object.values(p.hands).flat();
      expect(dealt).toHaveLength(10);
      expect(p.turnOrder.map((id) => p.hands[id]?.length)).toEqual([5, 5]);
      const env = [p.envelope.suspect, p.envelope.weapon, p.envelope.room];
      for (const c of roomCardIds) {
        expect(dealt).not.toContain(c);
        expect(env).not.toContain(c);
      }
      const all = [...dealt, ...env, ...roomCardIds];
      expect(all).toHaveLength(21);
      expect(new Set(all)).toEqual(new Set([...characterIds, ...weaponIds, ...roomIds]));
    },
  );

  it("roomCards=3 with 3 players deals 15 cards 5/5/5", () => {
    const p = startWith(3, ["red", "white", "blue"], seqRng([0.3, 0.6, 0.1, 0.8]));
    expect(Object.keys(p.roomCards)).toHaveLength(3);
    expect(p.turnOrder.map((id) => p.hands[id]?.length)).toEqual([5, 5, 5]);
  });
});
