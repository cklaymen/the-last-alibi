export type GameId = string & { readonly __brand: "GameId" };
export type PlayerId = string & { readonly __brand: "PlayerId" };
export type RoomCode = string & { readonly __brand: "RoomCode" };

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
