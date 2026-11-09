export type GameId = string & { readonly __brand: "GameId" };
export type PlayerId = string & { readonly __brand: "PlayerId" };
export type RoomCode = string & { readonly __brand: "RoomCode" };
export type Rng = () => number;

export const characterIds = [
  "scarlet",
  "mustard",
  "orchid",
  "peacock",
  "plum",
  "green",
] as const;

export type CharacterId = (typeof characterIds)[number];
export type GamePhase = "LOBBY" | "IN_PROGRESS" | "FINISHED";

export const roomIds = [
  "kitchen",
  "ballroom",
  "conservatory",
  "billiard_room",
  "library",
  "study",
  "hall",
  "lounge",
  "dining_room",
] as const;

export type RoomId = (typeof roomIds)[number];

export const weaponIds = [
  "candlestick",
  "knife",
  "lead_pipe",
  "revolver",
  "rope",
  "wrench",
] as const;

export type WeaponId = (typeof weaponIds)[number];

export type CardId = CharacterId | WeaponId | RoomId;

export interface BoardPosition {
  readonly row: number;
  readonly col: number;
}

export interface CharacterToken {
  readonly characterId: CharacterId;
  readonly position: BoardPosition;
}

export interface WeaponToken {
  readonly weaponId: WeaponId;
  readonly roomId: RoomId;
}

export interface Suggestion {
  readonly suspect: CharacterId;
  readonly weapon: WeaponId;
  readonly room: RoomId;
}

export type TurnPhase =
  | "ROLL"
  | "MOVE"
  | "ACTION"
  | "SUGGEST_PENDING_DISPROVE"
  | "DONE";

export interface Turn {
  readonly playerId: PlayerId;
  readonly phase: TurnPhase;
  readonly diceRoll?: readonly [number, number];
  readonly remainingMoves?: number;
  readonly suggestion?: Suggestion;
  readonly disproveQueue?: readonly PlayerId[];
  readonly lastDisproval?: {
    readonly byPlayerId: PlayerId;
    readonly cardId: CardId;
  } | null;
}

export interface Envelope {
  readonly suspect: CharacterId;
  readonly weapon: WeaponId;
  readonly room: RoomId;
}

export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly characterId?: CharacterId;
  readonly isReady: boolean;
}

export interface Game {
  readonly id: GameId;
  readonly roomCode: RoomCode;
  readonly hostId: PlayerId;
  readonly maxPlayers: number;
  readonly phase: GamePhase;
  readonly players: readonly Player[];
}

export interface InProgressGame extends Game {
  readonly phase: "IN_PROGRESS" | "FINISHED";
  readonly turn: Turn;
  readonly turnOrder: readonly PlayerId[];
  readonly characterTokens: readonly CharacterToken[];
  readonly weaponTokens: readonly WeaponToken[];
  readonly envelope: Envelope;
  readonly eliminatedPlayers: readonly PlayerId[];
  readonly playerHands: Map<PlayerId, readonly CardId[]>;
  readonly winner?: PlayerId;
}

export type JoinGameResult =
  | { readonly ok: true; readonly game: Game }
  | {
      readonly ok: false;
      readonly reason: "GAME_FULL" | "PLAYER_ALREADY_JOINED";
    };

export type LobbyActionResult =
  | { readonly ok: true; readonly game: Game }
  | {
      readonly ok: false;
      readonly reason:
        | "CHARACTER_TAKEN"
        | "PLAYER_NOT_FOUND"
        | "GAME_NOT_READY";
    };
