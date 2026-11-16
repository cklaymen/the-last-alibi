// ── Identifiers (single source of truth; contracts import these) ───────────

export type GameId = string & { readonly __brand: "GameId" };
export type PlayerId = string & { readonly __brand: "PlayerId" };
export type RoomCode = string & { readonly __brand: "RoomCode" };

/** Returns a float in [0, 1). Injected so logic is deterministic in tests. */
export type Rng = () => number;

/**
 * Neutral character ids named by colour. Order = SEAT_ORDER: red moves first,
 * then clockwise around the board.
 */
export const characterIds = [
  "red",
  "yellow",
  "white",
  "green",
  "blue",
  "purple",
] as const;
export type CharacterId = (typeof characterIds)[number];

export const weaponIds = [
  "candlestick",
  "dagger",
  "lead_pipe",
  "revolver",
  "rope",
  "wrench",
] as const;
export type WeaponId = (typeof weaponIds)[number];

export const roomIds = [
  "kitchen",
  "ballroom",
  "conservatory",
  "dining_room",
  "billiard_room",
  "library",
  "lounge",
  "hall",
  "study",
] as const;
export type RoomId = (typeof roomIds)[number];

export type CardId = CharacterId | WeaponId | RoomId;
export type CardKind = "suspect" | "weapon" | "room";

// ── Board positions ─────────────────────────────────────────────────────────

export interface Position {
  readonly row: number;
  readonly col: number;
}

/** A pawn is either on a corridor cell or inside a room (never "on a door"). */
export type Location =
  | { readonly kind: "cell"; readonly position: Position }
  | { readonly kind: "room"; readonly roomId: RoomId };

// ── Lobby ───────────────────────────────────────────────────────────────────

export type GamePhase = "LOBBY" | "IN_PROGRESS" | "FINISHED";

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly characterId?: CharacterId;
}

export interface Triple {
  readonly suspect: CharacterId;
  readonly weapon: WeaponId;
  readonly room: RoomId;
}
export type Envelope = Triple;
export type Suggestion = Triple;
export type Accusation = Triple;

// ── Room settings (house rules, chosen by the host in the lobby) ───────────

/** Turn time limit options in seconds; null = no limit. */
export const turnTimeLimits = [null, 30, 60, 90, 120, 180] as const;
/** Disprove time limit options in seconds; null = no limit. */
export const disproveTimeLimits = [null, 15, 30, 45, 60] as const;
/** Maximum number of cards laid out face down in rooms. */
export const MAX_ROOM_CARDS = 8;

/** Where an accusation may be made: in any room, or only in the named room. */
export const accusationPlaces = ["any_room", "named_room"] as const;
export type AccusationPlace = (typeof accusationPlaces)[number];

export type TurnTimeLimit = (typeof turnTimeLimits)[number];
export type DisproveTimeLimit = (typeof disproveTimeLimits)[number];

export interface RoomSettings {
  readonly accusationPlace: AccusationPlace;
  readonly accuseAfterSuggestion: boolean;
  readonly suggestAfterStaying: boolean;
  readonly turnTimeLimitSec: TurnTimeLimit;
  readonly disproveTimeLimitSec: DisproveTimeLimit;
  /** Integer 0..MAX_ROOM_CARDS. */
  readonly roomCards: number;
  readonly autoNotes: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  accusationPlace: "any_room",
  accuseAfterSuggestion: true,
  suggestAfterStaying: false,
  turnTimeLimitSec: 90,
  disproveTimeLimitSec: 30,
  roomCards: 0,
  autoNotes: true,
};

// ── Play state ──────────────────────────────────────────────────────────────

export type ActionId =
  | "roll"
  | "move"
  | "passage"
  | "suggest"
  | "accuse"
  | "end_turn"
  | "disprove";

export interface PendingSuggestion {
  readonly suggesterId: PlayerId;
  readonly suggestion: Suggestion;
  /** Player who must show a card now (always holds ≥1 matching card). */
  readonly disproverId: PlayerId;
}

export interface Turn {
  readonly playerId: PlayerId;
  /** Result of the roll this turn; null = not rolled yet. */
  readonly dice: readonly [number, number] | null;
  /** True once the pawn moved or used a secret passage this turn. */
  readonly hasMoved: boolean;
  /** Room the player left this turn (may not re-enter it this turn). */
  readonly leftRoom: RoomId | null;
  /** Room in which a suggestion is allowed this turn (entered or summoned to). */
  readonly suggestionRoom: RoomId | null;
  readonly hasSuggested: boolean;
  readonly pendingSuggestion: PendingSuggestion | null;
}

export type WinReason = "ACCUSATION" | "LAST_STANDING";

/** Public events; never contain hidden information (no shown card ids). */
export type GameEvent =
  | { readonly type: "game_started"; readonly firstPlayerId: PlayerId }
  | {
      readonly type: "rolled";
      readonly playerId: PlayerId;
      readonly dice: readonly [number, number];
    }
  | {
      readonly type: "moved";
      readonly playerId: PlayerId;
      readonly to: Location;
    }
  | {
      readonly type: "passage_used";
      readonly playerId: PlayerId;
      readonly from: RoomId;
      readonly to: RoomId;
    }
  | {
      readonly type: "suggested";
      readonly playerId: PlayerId;
      readonly suggestion: Suggestion;
    }
  | { readonly type: "cannot_disprove"; readonly playerId: PlayerId }
  | {
      readonly type: "card_shown";
      readonly playerId: PlayerId;
      readonly toPlayerId: PlayerId;
    }
  | { readonly type: "no_one_disproved"; readonly suggesterId: PlayerId }
  | {
      readonly type: "accused";
      readonly playerId: PlayerId;
      readonly accusation: Accusation;
      readonly correct: boolean;
    }
  | { readonly type: "turn_ended"; readonly playerId: PlayerId }
  /** The player was away (offline too long); the server ended their turn. */
  | { readonly type: "turn_skipped"; readonly playerId: PlayerId }
  /** The turn time limit ran out; the server ended the turn. */
  | { readonly type: "turn_timed_out"; readonly playerId: PlayerId }
  /** The disprove time limit ran out; emitted right before the automatic card_shown. */
  | { readonly type: "disprove_timed_out"; readonly playerId: PlayerId }
  | {
      readonly type: "game_won";
      readonly playerId: PlayerId;
      readonly reason: WinReason;
    };

/** A card privately shown to a suggester. */
export interface Reveal {
  readonly toPlayerId: PlayerId;
  readonly fromPlayerId: PlayerId;
  readonly cardId: CardId;
}

export interface PlayState {
  /** Participating players in SEAT_ORDER (clockwise, red first). */
  readonly turnOrder: readonly PlayerId[];
  readonly turn: Turn;
  /** All six pawns are always on the board. */
  readonly pawns: Readonly<Record<CharacterId, Location>>;
  readonly weapons: Readonly<Record<WeaponId, RoomId>>;
  readonly envelope: Envelope;
  readonly hands: Readonly<Record<string, readonly CardId[]>>;
  readonly eliminated: readonly PlayerId[];
  /** Players moved by someone else's suggestion since their last turn. */
  readonly summonedTo: Readonly<Record<string, RoomId>>;
  readonly reveals: readonly Reveal[];
  /** Cards laid face down in rooms (secret; never in public state). Empty when settings.roomCards = 0. */
  readonly roomCards: Readonly<Partial<Record<RoomId, CardId>>>;
  readonly events: readonly GameEvent[];
  readonly winner: { readonly playerId: PlayerId; readonly reason: WinReason } | null;
}

/** Summary of the previous game, shown in the lobby after it ends. */
export interface LastResult {
  readonly winnerId: PlayerId;
  /** Name at the time of winning (the player may have left since). */
  readonly winnerName: string;
  readonly reason: WinReason;
  readonly envelope: Envelope;
}

export interface Game {
  readonly id: GameId;
  readonly roomCode: RoomCode;
  readonly hostId: PlayerId;
  readonly maxPlayers: number;
  readonly phase: GamePhase;
  readonly players: readonly Player[];
  /** null while in LOBBY. */
  readonly play: PlayState | null;
  /** Result of the previous game in this room; null before the first one ends. */
  readonly lastResult: LastResult | null;
  /** House rules; changed by the host in LOBBY only, kept across restarts. */
  readonly settings: RoomSettings;
}
