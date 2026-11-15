export { GameContext, useGame } from "./GameContext.js";
export type { GameContextValue } from "./GameContext.js";
/** Owned by the shell agent: socket connection + state, provides GameContext. */
export { GameProvider } from "./GameProvider.js";
/** Owned by the game-screen agent: the in-progress game view. */
export { GameScreen } from "./GameScreen.js";
