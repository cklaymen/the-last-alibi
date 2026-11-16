import type { CommandHandler } from "./command.js";
import { accuseHandler } from "./accuse.handler.js";
import { chooseCharacterHandler } from "./choose-character.handler.js";
import { disproveHandler } from "./disprove.handler.js";
import { endTurnHandler } from "./end-turn.handler.js";
import { moveHandler } from "./move.handler.js";
import { passageHandler } from "./passage.handler.js";
import { kickHandler } from "./kick.handler.js";
import { renameHandler } from "./rename.handler.js";
import { rollHandler } from "./roll.handler.js";
import { startHandler } from "./start.handler.js";
import { suggestHandler } from "./suggest.handler.js";
import { settingsHandler } from "./settings.handler.js";

export type { CommandDeps, CommandEffects, CommandHandler } from "./command.js";

/** Registry of socket commands (append-only: add a handler file + one entry). */
export const commandHandlers: readonly CommandHandler[] = [
  chooseCharacterHandler,
  startHandler,
  kickHandler,
  renameHandler,
  rollHandler,
  moveHandler,
  passageHandler,
  suggestHandler,
  disproveHandler,
  accuseHandler,
  endTurnHandler,
  settingsHandler,
];
