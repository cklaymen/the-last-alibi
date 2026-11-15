import type { ComponentType } from "react";
import type { ActionId, PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import type { Send } from "./useCommand.js";

export interface ActionProps {
  game: PublicGameState;
  me: PrivateGameState;
  myId: string;
  send: Send;
}

/** One entry of the turn-action registry (see actions.ts). */
export interface TurnAction {
  id: ActionId;
  Component: ComponentType<ActionProps>;
}
