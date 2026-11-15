import { rollDice } from "@mystery-game/game";
import { scriptedDiceRng } from "../rng.js";
import { defineCommand, emptyPayloadSchema } from "./command.js";

export const rollHandler = defineCommand({
  event: "turn:roll",
  schema: emptyPayloadSchema,
  execute: (game, playerId, _payload, deps) => {
    const scripted = deps.diceQueue.peek(game.roomCode);
    const rng = scripted ? scriptedDiceRng(scripted, deps.newRng()) : deps.newRng();
    const result = rollDice(game, playerId, rng);
    // Consume the scripted pair only when the roll actually happened.
    if (result.ok && scripted) deps.diceQueue.shift(game.roomCode);
    return result;
  },
});
