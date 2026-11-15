import { accuseCommandSchema } from "@mystery-game/contracts";
import { makeAccusation } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const accuseHandler = defineCommand({
  event: "turn:accuse",
  schema: accuseCommandSchema,
  execute: (game, playerId, accusation) => makeAccusation(game, playerId, accusation),
});
