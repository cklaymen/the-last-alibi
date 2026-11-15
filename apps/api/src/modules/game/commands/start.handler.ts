import { startGame } from "@mystery-game/game";
import { defineCommand, emptyPayloadSchema } from "./command.js";

export const startHandler = defineCommand({
  event: "room:start",
  schema: emptyPayloadSchema,
  execute: (game, playerId, _payload, deps) => startGame(game, playerId, deps.newRng()),
});
