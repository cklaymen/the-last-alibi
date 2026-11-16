export * from "./shared/types.js";
export type { GameErrorCode, GameResult } from "./shared/result.js";
export * from "./board/layout.js";
export {
  createGame,
  joinGame,
  chooseCharacter,
  renamePlayer,
  removePlayer,
  kickPlayer,
  returnToLobby,
  isNameTaken,
  updateSettings,
} from "./lobby/index.js";
export { resolveAway } from "./presence/index.js";
export { startGame } from "./setup/index.js";
export {
  rollDice,
  movePawn,
  useSecretPassage,
  reachableFor,
} from "./movement/index.js";
export { matchingCards, makeSuggestion, disprove } from "./suggestion/index.js";
export { makeAccusation } from "./accusation/index.js";
export { endTurn, availableActions } from "./turn-flow/index.js";
export { timeOutTurn } from "./turn-flow/index.js";
export { autoDisprove } from "./suggestion/index.js";

export const gameId = (v: string) => v as import("./shared/types.js").GameId;
export const playerId = (v: string) =>
  v as import("./shared/types.js").PlayerId;
export const roomCode = (v: string) =>
  v as import("./shared/types.js").RoomCode;
