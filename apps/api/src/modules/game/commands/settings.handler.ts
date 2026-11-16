import { updateSettingsSchema } from "@mystery-game/contracts";
import { updateSettings, type RoomSettings } from "@mystery-game/game";
import { defineCommand } from "./command.js";

export const settingsHandler = defineCommand({
  event: "room:settings",
  schema: updateSettingsSchema,
  execute: (game, playerId, payload) => {
    // Drop absent fields so they keep their current value.
    const patch = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ) as Partial<RoomSettings>;
    return updateSettings(game, playerId, patch);
  },
});
