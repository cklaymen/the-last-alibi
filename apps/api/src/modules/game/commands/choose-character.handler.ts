import { chooseCharacterSchema } from "@mystery-game/contracts";
import { chooseCharacter } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const chooseCharacterHandler = defineCommand({
  event: "room:choose_character",
  schema: chooseCharacterSchema,
  execute: (game, playerId, { characterId }) => chooseCharacter(game, playerId, characterId),
});
