import { z } from "zod";
import { cardIdSchema, characterIdSchema, roomIdSchema, weaponIdSchema } from "../ids.js";
import { locationSchema, tripleSchema } from "../game/index.js";
import { updateSettingsSchema } from "../settings/index.js";

/**
 * Body of POST /testing/rooms/:code/scenario (only when ENABLE_TEST_API=1).
 * Players are referenced by name. All fields optional; applied to a started game.
 */
export const scenarioSchema = z.object({
  envelope: tripleSchema.optional(),
  hands: z.record(z.string(), z.array(cardIdSchema)).optional(),
  pawns: z.partialRecord(characterIdSchema, locationSchema).optional(),
  weapons: z.partialRecord(weaponIdSchema, roomIdSchema).optional(),
  /** Queue of upcoming dice rolls, e.g. [[3,4],[1,1]]. */
  dice: z.array(z.tuple([z.number().int().min(1).max(6), z.number().int().min(1).max(6)])).optional(),
  /** Make this player active with a fresh turn (start of turn). */
  activePlayer: z.string().optional(),
  /** Players summoned to a room by a suggestion (may suggest without moving). */
  summonedTo: z.record(z.string(), roomIdSchema).optional(),
  /** Face-down room cards; replaces the dealt ones entirely (hands are not adjusted). */
  roomCards: z.partialRecord(roomIdSchema, cardIdSchema).optional(),
  /** House-rule overrides for the running game (only the given fields change). */
  settings: updateSettingsSchema.optional(),
  /** Overrides the room's turn/disprove limits (ms) and restarts the countdowns. */
  timeLimitsMs: z
    .object({
      turn: z.number().int().positive().optional(),
      disprove: z.number().int().positive().optional(),
    })
    .optional(),
});
export type Scenario = z.infer<typeof scenarioSchema>;
