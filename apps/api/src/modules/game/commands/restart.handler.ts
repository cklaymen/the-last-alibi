import { gameId, restartGame } from "@mystery-game/game";
import { defineCommand, emptyPayloadSchema } from "./command.js";

export const restartHandler = defineCommand({
  event: "room:restart",
  schema: emptyPayloadSchema,
  execute: (game, playerId, _payload, deps) => restartGame(game, playerId, gameId(deps.newId())),
});
