import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Game, PlayerId } from "@mystery-game/game";
import { AppError } from "../../shared/app-error.js";
import { parseOrThrow } from "../../shared/validation.js";
import type { CommandDeps, CommandHandler } from "./commands/index.js";
import { StatePublisher } from "./notifier/state.publisher.js";
import { GAME_REPOSITORY, type GameRepository } from "./repository/game.repository.js";
import { DiceQueue, RNG_FACTORY, type RngFactory } from "./rng.js";

/** Orchestrates a command: load → validate → domain → save → publish. */
@Injectable()
export class GameService {
  private readonly deps: CommandDeps;

  public constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(StatePublisher) private readonly publisher: StatePublisher,
    @Inject(RNG_FACTORY) rngFactory: RngFactory,
    @Inject(DiceQueue) diceQueue: DiceQueue,
  ) {
    this.deps = { newRng: rngFactory, diceQueue, newId: randomUUID };
  }

  public load(roomCode: string): Game {
    const game = this.games.get(roomCode);
    if (!game) throw new AppError("ROOM_NOT_FOUND");
    return game;
  }

  public execute(
    roomCode: string,
    playerId: PlayerId,
    handler: CommandHandler,
    rawPayload: unknown,
  ): void {
    const payload = parseOrThrow(handler.schema, rawPayload);
    const result = handler.execute(this.load(roomCode), playerId, payload, this.deps);
    if (!result.ok) throw new AppError(result.code);
    this.commit(result.game);
  }

  /** Saves and broadcasts a changed game. */
  public commit(game: Game): void {
    this.games.save(game);
    this.publisher.publish(game);
  }
}
