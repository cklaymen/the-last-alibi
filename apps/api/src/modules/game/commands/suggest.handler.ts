import { suggestCommandSchema } from "@mystery-game/contracts";
import { makeSuggestion } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const suggestHandler = defineCommand({
  event: "turn:suggest",
  schema: suggestCommandSchema,
  execute: (game, playerId, { suspect, weapon }) => makeSuggestion(game, playerId, suspect, weapon),
});
