import { useSecretPassage } from "@mystery-game/game";
import { defineCommand, emptyPayloadSchema } from "./command.js";

export const passageHandler = defineCommand({
  event: "turn:passage",
  schema: emptyPayloadSchema,
  execute: (game, playerId) => useSecretPassage(game, playerId),
});
