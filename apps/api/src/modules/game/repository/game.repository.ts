import { Injectable } from "@nestjs/common";
import type { Game } from "@mystery-game/game";

/** Stores the authoritative domain `Game` per room code. */
export interface GameRepository {
  get(roomCode: string): Game | undefined;
  save(game: Game): void;
}

export const GAME_REPOSITORY = Symbol("GAME_REPOSITORY");

@Injectable()
export class InMemoryGameRepository implements GameRepository {
  private readonly games = new Map<string, Game>();

  public get(roomCode: string): Game | undefined {
    return this.games.get(roomCode);
  }

  public save(game: Game): void {
    this.games.set(game.roomCode, game);
  }
}
