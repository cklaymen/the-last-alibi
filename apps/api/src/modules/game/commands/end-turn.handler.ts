import { endTurn } from "@mystery-game/game";
import { defineCommand, emptyPayloadSchema } from "./command.js";

export const endTurnHandler = defineCommand({
  event: "turn:end",
  schema: emptyPayloadSchema,
  execute: (game, playerId) => endTurn(game, playerId),
});
