import { z } from "zod";
import {
  cardIdSchema,
  characterIdSchema,
  roomIdSchema,
  weaponIdSchema,
} from "../ids.js";
import { roomSettingsSchema } from "../settings/index.js";

export const positionSchema = z.object({
  row: z.number().int().min(0).max(24),
  col: z.number().int().min(0).max(23),
});

export const locationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("cell"), position: positionSchema }),
  z.object({ kind: z.literal("room"), roomId: roomIdSchema }),
]);

export const tripleSchema = z.object({
  suspect: characterIdSchema,
  weapon: weaponIdSchema,
  room: roomIdSchema,
});

export const actionIdSchema = z.enum([
  "roll",
  "move",
  "passage",
  "suggest",
  "accuse",
  "end_turn",
  "disprove",
]);

const dice = z.tuple([z.number().int(), z.number().int()]);

export const gameEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("game_started"), firstPlayerId: z.string() }),
  z.object({ type: z.literal("rolled"), playerId: z.string(), dice }),
  z.object({ type: z.literal("moved"), playerId: z.string(), to: locationSchema }),
  z.object({
    type: z.literal("passage_used"),
    playerId: z.string(),
    from: roomIdSchema,
    to: roomIdSchema,
  }),
  z.object({ type: z.literal("suggested"), playerId: z.string(), suggestion: tripleSchema }),
  z.object({ type: z.literal("cannot_disprove"), playerId: z.string() }),
  z.object({ type: z.literal("card_shown"), playerId: z.string(), toPlayerId: z.string() }),
  z.object({ type: z.literal("no_one_disproved"), suggesterId: z.string() }),
  z.object({
    type: z.literal("accused"),
    playerId: z.string(),
    accusation: tripleSchema,
    correct: z.boolean(),
  }),
  z.object({ type: z.literal("turn_ended"), playerId: z.string() }),
  z.object({ type: z.literal("turn_skipped"), playerId: z.string() }),
  z.object({ type: z.literal("turn_timed_out"), playerId: z.string() }),
  /** Emitted right before the automatic card_shown. */
  z.object({ type: z.literal("disprove_timed_out"), playerId: z.string() }),
  z.object({
    type: z.literal("game_won"),
    playerId: z.string(),
    reason: z.enum(["ACCUSATION", "LAST_STANDING"]),
  }),
]);

/** Running countdown (turn or disprove); null when no limit applies. */
export const gameTimerSchema = z.object({
  kind: z.enum(["turn", "disprove"]),
  /** Player whose time is running. */
  playerId: z.string(),
  remainingMs: z.number().int().min(0),
  durationMs: z.number().int().positive(),
});

/** Broadcast to everyone in the room (`game:state`). Never contains hidden cards. */
export const publicGameStateSchema = z.object({
  gameId: z.string(),
  status: z.enum(["IN_PROGRESS", "FINISHED"]),
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      characterId: characterIdSchema,
      cardCount: z.number().int(),
      eliminated: z.boolean(),
      presence: z.enum(["online", "offline", "away"]),
    }),
  ),
  /** Player ids in turn order. */
  turnOrder: z.array(z.string()),
  turn: z.object({
    playerId: z.string(),
    dice: dice.nullable(),
    hasMoved: z.boolean(),
    pendingSuggestion: z
      .object({
        suggesterId: z.string(),
        suggestion: tripleSchema,
        disproverId: z.string(),
      })
      .nullable(),
  }),
  pawns: z.array(z.object({ characterId: characterIdSchema, location: locationSchema })),
  weapons: z.array(z.object({ weaponId: weaponIdSchema, roomId: roomIdSchema })),
  /** Event log, oldest first (`seq` = index in the full log). */
  events: z.array(z.object({ seq: z.number().int(), event: gameEventSchema })),
  winner: z
    .object({ playerId: z.string(), reason: z.enum(["ACCUSATION", "LAST_STANDING"]) })
    .nullable(),
  /** Revealed only when status === "FINISHED". */
  envelope: tripleSchema.nullable(),
  /** House rules this game is played with. */
  settings: roomSettingsSchema,
  timer: gameTimerSchema.nullable(),
  /** Rooms holding a face-down room card (ids of the cards stay private). */
  roomsWithCards: z.array(roomIdSchema),
});

/** Sent only to one player (`game:private`). */
export const privateGameStateSchema = z.object({
  gameId: z.string(),
  playerId: z.string(),
  hand: z.array(cardIdSchema),
  availableActions: z.array(actionIdSchema),
  reachable: z.array(locationSchema),
  /** Present only for the player who must now show a card. */
  disproveRequest: z
    .object({
      suggesterId: z.string(),
      suggestion: tripleSchema,
      matchingCards: z.array(cardIdSchema),
    })
    .nullable(),
  /** Cards shown to this player, oldest first. */
  seenCards: z.array(z.object({ cardId: cardIdSchema, fromPlayerId: z.string() })),
  /** The envelope, visible to a player eliminated by a wrong accusation. */
  envelope: tripleSchema.nullable(),
  /** Room cards of the rooms this player has stood in. */
  roomCards: z.array(z.object({ roomId: roomIdSchema, cardId: cardIdSchema })),
});

// ── Commands (socket payloads) ─────────────────────────────────────────────
export const moveCommandSchema = z.object({ to: locationSchema });
export const suggestCommandSchema = z.object({
  suspect: characterIdSchema,
  weapon: weaponIdSchema,
});
export const disproveCommandSchema = z.object({ cardId: cardIdSchema });
export const accuseCommandSchema = tripleSchema;

export type Position = z.infer<typeof positionSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Triple = z.infer<typeof tripleSchema>;
export type GameEvent = z.infer<typeof gameEventSchema>;
export type GameTimer = z.infer<typeof gameTimerSchema>;
export type PublicGameState = z.infer<typeof publicGameStateSchema>;
export type PrivateGameState = z.infer<typeof privateGameStateSchema>;
export type MoveCommand = z.infer<typeof moveCommandSchema>;
export type SuggestCommand = z.infer<typeof suggestCommandSchema>;
export type DisproveCommand = z.infer<typeof disproveCommandSchema>;
export type AccuseCommand = z.infer<typeof accuseCommandSchema>;
