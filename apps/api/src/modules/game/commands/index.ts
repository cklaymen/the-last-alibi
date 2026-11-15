import type { CommandHandler } from "./command.js";
import { accuseHandler } from "./accuse.handler.js";
import { chooseCharacterHandler } from "./choose-character.handler.js";
import { disproveHandler } from "./disprove.handler.js";
import { endTurnHandler } from "./end-turn.handler.js";
import { moveHandler } from "./move.handler.js";
import { passageHandler } from "./passage.handler.js";
import { restartHandler } from "./restart.handler.js";
import { rollHandler } from "./roll.handler.js";
import { startHandler } from "./start.handler.js";
import { suggestHandler } from "./suggest.handler.js";

export type { CommandDeps, CommandHandler } from "./command.js";

/** Registry of socket commands (append-only: add a handler file + one entry). */
export const commandHandlers: readonly CommandHandler[] = [
  chooseCharacterHandler,
  startHandler,
  restartHandler,
  rollHandler,
  moveHandler,
  passageHandler,
  suggestHandler,
  disproveHandler,
  accuseHandler,
  endTurnHandler,
];
