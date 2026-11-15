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
  readonly events: readonly GameEvent[];
  readonly winner: { readonly playerId: PlayerId; readonly reason: WinReason } | null;
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
}
