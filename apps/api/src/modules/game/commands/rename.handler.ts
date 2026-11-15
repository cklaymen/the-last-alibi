import { renamePlayerSchema } from "@mystery-game/contracts";
import { renamePlayer } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const renameHandler = defineCommand({
  event: "room:rename",
  schema: renamePlayerSchema,
  execute: (game, playerId, { name }) => renamePlayer(game, playerId, name),
});
