import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import type {
  PrivateGameState,
  PublicGameState,
  RoomSettings,
  RoomSummary,
} from "@mystery-game/contracts";
import { GameContext, type GameContextValue } from "../features/game/index.js";

export const testSettings: RoomSettings = {
  accusationPlace: "any_room",
  accuseAfterSuggestion: true,
  suggestAfterStaying: false,
  turnTimeLimitSec: 90,
  disproveTimeLimitSec: 30,
  roomCards: 0,
  autoNotes: true,
};

export const testRoom: RoomSummary = {
  id: "game-1",
  code: "1234",
  hostId: "p1",
  maxPlayers: 6,
  phase: "IN_PROGRESS",
  players: [
    { id: "p1", name: "Alice", characterId: "red", presence: "online" },
    { id: "p2", name: "Bob", characterId: "blue", presence: "online" },
  ],
  lastResult: null,
  settings: testSettings,
};

export const testGame: PublicGameState = {
  gameId: "game-1",
  status: "IN_PROGRESS",
  players: [
    { id: "p1", name: "Alice", characterId: "red", cardCount: 9, eliminated: false, presence: "online" },
    { id: "p2", name: "Bob", characterId: "blue", cardCount: 9, eliminated: false, presence: "online" },
  ],
  turnOrder: ["p1", "p2"],
  turn: { playerId: "p1", dice: null, hasMoved: false, pendingSuggestion: null },
  pawns: [],
  weapons: [],
  events: [],
  winner: null,
  envelope: null,
  settings: testSettings,
  timer: null,
  roomsWithCards: [],
};

export const testMe: PrivateGameState = {
  gameId: "game-1",
  playerId: "p1",
  hand: ["red", "rope"],
  availableActions: [],
  reachable: [],
  disproveRequest: null,
  seenCards: [],
  envelope: null,
  roomCards: [],
};

/** Renders `ui` inside a fake GameContext; `send` is a vi.fn resolving { ok: true }. */
export function renderWithGame(ui: ReactElement, overrides: Partial<GameContextValue> = {}) {
  const value: GameContextValue = {
    room: testRoom,
    myId: "p1",
    game: testGame,
    me: testMe,
    connected: true,
    send: vi.fn(async () => ({ ok: true as const })),
    leave: vi.fn(),
    ...overrides,
  };
  const utils = render(<GameContext.Provider value={value}>{ui}</GameContext.Provider>);
  return {
    ...utils,
    value,
    rerenderWith: (next: Partial<GameContextValue>) =>
      utils.rerender(
        <GameContext.Provider value={{ ...value, ...next }}>{ui}</GameContext.Provider>,
      ),
  };
}
