import { kickPlayerSchema } from "@mystery-game/contracts";
import { kickPlayer, playerId as toPlayerId } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const kickHandler = defineCommand({
  event: "room:kick",
  schema: kickPlayerSchema,
  execute: (game, playerId, { playerId: target }) => kickPlayer(game, playerId, toPlayerId(target)),
  afterCommit: ({ playerId: target }, effects) => effects.expel(toPlayerId(target)),
});
