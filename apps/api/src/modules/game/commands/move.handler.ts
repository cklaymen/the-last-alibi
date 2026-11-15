import { moveCommandSchema } from "@mystery-game/contracts";
import { movePawn } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const moveHandler = defineCommand({
  event: "turn:move",
  schema: moveCommandSchema,
  execute: (game, playerId, { to }) => movePawn(game, playerId, to),
});
