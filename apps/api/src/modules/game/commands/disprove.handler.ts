import { disproveCommandSchema } from "@mystery-game/contracts";
import { disprove } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const disproveHandler = defineCommand({
  event: "turn:disprove",
  schema: disproveCommandSchema,
  execute: (game, playerId, { cardId }) => disprove(game, playerId, cardId),
});
