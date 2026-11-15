/** Test-only builders for game states (imported by *.test.tsx files only). */
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";

export function makeGame(overrides: Partial<PublicGameState> = {}): PublicGameState {
  return {
    gameId: "g1",
    status: "IN_PROGRESS",
    players: [
      { id: "p1", name: "Alice", characterId: "red", cardCount: 6, eliminated: false, presence: "online" },
      { id: "p2", name: "Bob", characterId: "white", cardCount: 6, eliminated: false, presence: "online" },
      { id: "p3", name: "Cleo", characterId: "blue", cardCount: 6, eliminated: false, presence: "online" },
    ],
    turnOrder: ["p1", "p2", "p3"],
    turn: { playerId: "p1", dice: null, hasMoved: false, pendingSuggestion: null },
    pawns: [
      { characterId: "red", location: { kind: "cell", position: { row: 24, col: 7 } } },
      { characterId: "yellow", location: { kind: "cell", position: { row: 17, col: 0 } } },
      { characterId: "white", location: { kind: "room", roomId: "kitchen" } },
      { characterId: "green", location: { kind: "cell", position: { row: 0, col: 16 } } },
      { characterId: "blue", location: { kind: "room", roomId: "kitchen" } },
      { characterId: "purple", location: { kind: "cell", position: { row: 19, col: 23 } } },
    ],
    weapons: [
      { weaponId: "candlestick", roomId: "kitchen" },
      { weaponId: "dagger", roomId: "ballroom" },
      { weaponId: "lead_pipe", roomId: "conservatory" },
      { weaponId: "revolver", roomId: "kitchen" },
      { weaponId: "rope", roomId: "library" },
      { weaponId: "wrench", roomId: "study" },
    ],
    events: [],
    winner: null,
    envelope: null,
    ...overrides,
  };
}

export function makeMe(overrides: Partial<PrivateGameState> = {}): PrivateGameState {
  return {
    gameId: "g1",
    playerId: "p1",
    hand: ["green", "rope", "hall"],
    availableActions: [],
    reachable: [],
    disproveRequest: null,
    seenCards: [],
    envelope: null,
    ...overrides,
  };
}
