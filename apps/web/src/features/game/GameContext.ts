import { createContext, useContext } from "react";
import type {
  ClientToServerEvents,
  CommandResult,
  PrivateGameState,
  PublicGameState,
  RoomSummary,
} from "@mystery-game/contracts";

type PayloadOf<E extends keyof ClientToServerEvents> = Parameters<
  ClientToServerEvents[E]
>[0];

export interface GameContextValue {
  room: RoomSummary;
  /** Id of the player using this browser. */
  myId: string;
  /** null while in LOBBY (or until the first game:state arrives). */
  game: PublicGameState | null;
  me: PrivateGameState | null;
  /** True while the socket is connected. */
  connected: boolean;
  /** Emits a command and resolves with the server ack. */
  send: <E extends keyof ClientToServerEvents>(
    event: E,
    payload: PayloadOf<E>,
  ) => Promise<CommandResult>;
  /** Forgets the session and returns to the join screen. */
  leave: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame() outside GameProvider");
  return value;
}
