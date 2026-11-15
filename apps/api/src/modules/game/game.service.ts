import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  gameId,
  removePlayer,
  resolveAway,
  returnToLobby,
  type Game,
  type PlayerId,
} from "@mystery-game/game";
import { AppError } from "../../shared/app-error.js";
import { parseOrThrow } from "../../shared/validation.js";
import { PresenceRegistry } from "../presence/index.js";
import { SESSION_REPOSITORY, type SessionRepository } from "../session/index.js";
import type { CommandDeps, CommandEffects, CommandHandler } from "./commands/index.js";
import {
  CONNECTION_CONTROL,
  GAME_NOTIFIER,
  type ConnectionControl,
  type GameNotifier,
} from "./notifier/game.notifier.js";
import { StatePublisher } from "./notifier/state.publisher.js";
import { GAME_REPOSITORY, type GameRepository } from "./repository/game.repository.js";
import { DiceQueue, RNG_FACTORY, type RngFactory } from "./rng.js";

/**
 * Orchestrates every change of a room: load → validate → domain → settle
 * (away rules, auto return to lobby) → save → publish. Also reacts to
 * presence changes (socket connect/disconnect, grace expiry).
 */
@Injectable()
export class GameService {
  private readonly deps: CommandDeps;

  public constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(StatePublisher) private readonly publisher: StatePublisher,
    @Inject(RNG_FACTORY) rngFactory: RngFactory,
    @Inject(DiceQueue) diceQueue: DiceQueue,
    @Inject(PresenceRegistry) private readonly presence: PresenceRegistry,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(GAME_NOTIFIER) private readonly notifier: GameNotifier,
    @Inject(CONNECTION_CONTROL) private readonly connections: ConnectionControl,
  ) {
    this.deps = { newRng: rngFactory, diceQueue, newId: randomUUID };
  }

  public load(roomCode: string): Game {
    const game = this.games.get(roomCode);
    if (!game) throw new AppError("ROOM_NOT_FOUND");
    return game;
  }

  public hasPlayer(roomCode: string, playerId: string): boolean {
    return this.games.get(roomCode)?.players.some((p) => p.id === playerId) ?? false;
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
    const effects: CommandEffects = { expel: (id) => this.expel(roomCode, id) };
    handler.afterCommit?.(payload, effects);
  }

  /** Applies the away rules / auto return to lobby, then saves and broadcasts. */
  public commit(game: Game): void {
    const { game: settled, removed } = this.settle(game);
    if (settled.players.length === 0) {
      this.deleteRoom(settled.roomCode);
      return;
    }
    this.games.save(settled);
    this.publisher.publish(settled);
    for (const id of removed) this.release(settled.roomCode, id);
  }

  /** A player was created over HTTP: they get the grace period to connect. */
  public playerJoined(roomCode: string, playerId: PlayerId): void {
    this.presence.expect(roomCode, playerId, () => this.graceExpired(roomCode, playerId));
  }

  public socketConnected(roomCode: string, playerId: PlayerId): void {
    const changed = this.presence.connected(roomCode, playerId);
    const game = this.games.get(roomCode);
    if (changed && game) this.publisher.publish(game);
  }

  public socketDisconnected(roomCode: string, playerId: PlayerId): void {
    const game = this.games.get(roomCode);
    // Removed / kicked players (or deleted rooms) are already forgotten.
    if (!game || !game.players.some((p) => p.id === playerId)) return;
    const changed = this.presence.disconnected(roomCode, playerId, () =>
      this.graceExpired(roomCode, playerId),
    );
    if (changed) this.publisher.publish(game);
  }

  private graceExpired(roomCode: string, playerId: PlayerId): void {
    const game = this.games.get(roomCode);
    if (!game || !game.players.some((p) => p.id === playerId)) {
      this.presence.forget(roomCode, playerId);
      return;
    }
    if (game.phase === "LOBBY") {
      const result = removePlayer(game, playerId);
      if (!result.ok) return;
      this.commit(result.game);
      this.release(roomCode, playerId);
      return;
    }
    if (this.presence.markAway(roomCode, playerId)) this.commit(game);
  }

  /** resolveAway → (FINISHED) returnToLobby → remove away players. Pure apart from id/rng. */
  private settle(game: Game): { game: Game; removed: PlayerId[] } {
    const away = this.presence.away(game.roomCode);
    let current = away.length > 0 ? resolveAway(game, away, this.deps.newRng()) : game;
    const removed: PlayerId[] = [];
    if (current.phase !== "FINISHED") return { game: current, removed };

    const back = returnToLobby(current, gameId(this.deps.newId()));
    if (!back.ok) return { game: current, removed };
    current = back.game;
    for (const id of away) {
      const result = removePlayer(current, id);
      if (!result.ok) continue;
      current = result.game;
      removed.push(id);
    }
    return { game: current, removed };
  }

  /** Kicked by the host: tell their sockets, then drop them. */
  private expel(roomCode: string, playerId: PlayerId): void {
    this.notifier.toPlayer(playerId, "room:kicked");
    this.release(roomCode, playerId);
  }

  /** Forgets a player who is no longer in the room. */
  private release(roomCode: string, playerId: PlayerId): void {
    this.presence.forget(roomCode, playerId);
    this.sessions.deletePlayer(roomCode, playerId);
    this.connections.disconnectPlayer(playerId);
  }

  private deleteRoom(roomCode: string): void {
    const game = this.games.get(roomCode);
    this.games.delete(roomCode);
    this.sessions.deleteRoom(roomCode);
    this.presence.forgetRoom(roomCode);
    for (const p of game?.players ?? []) this.connections.disconnectPlayer(p.id);
  }
}
