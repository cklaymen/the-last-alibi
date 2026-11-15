import { randomInt, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { RoomSessionResponse } from "@mystery-game/contracts";
import {
  createGame,
  gameId,
  joinGame,
  playerId as toPlayerId,
  roomCode as toRoomCode,
  type Game,
  type PlayerId,
} from "@mystery-game/game";
import { AppError } from "../../shared/app-error.js";
import {
  GAME_REPOSITORY,
  GameProjector,
  StatePublisher,
  type GameRepository,
} from "../game/index.js";
import { SESSION_REPOSITORY, type SessionRepository } from "../session/index.js";

const normalizeName = (name: string): string => name.trim().toLocaleLowerCase();

@Injectable()
export class RoomsService {
  public constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(GameProjector) private readonly projector: GameProjector,
    @Inject(StatePublisher) private readonly publisher: StatePublisher,
  ) {}

  public create(playerName: string): RoomSessionResponse {
    const code = this.newCode();
    const hostId = toPlayerId(randomUUID());
    const game = createGame(gameId(randomUUID()), toRoomCode(code), {
      id: hostId,
      name: playerName.trim(),
    });
    this.games.save(game);
    return this.response(game, hostId);
  }

  public join(playerName: string, roomCode: string): RoomSessionResponse {
    const game = this.find(roomCode);
    const name = playerName.trim();
    const id = toPlayerId(randomUUID());
    const result = joinGame(game, { id, name });
    if (!result.ok) throw new AppError(result.code);
    if (game.players.some((p) => normalizeName(p.name) === normalizeName(name))) {
      throw new AppError("NAME_TAKEN");
    }
    this.games.save(result.game);
    this.publisher.publish(result.game);
    return this.response(result.game, id);
  }

  public restore(roomCode: string, token: string | undefined): RoomSessionResponse {
    const session = token ? this.sessions.find(token) : undefined;
    if (!session || session.roomCode !== roomCode || !token) throw new AppError("UNAUTHORIZED");
    const game = this.find(roomCode);
    return {
      room: this.projector.room(game),
      session: { playerId: session.playerId, token },
    };
  }

  private find(roomCode: string): Game {
    const game = this.games.get(roomCode);
    if (!game) throw new AppError("ROOM_NOT_FOUND");
    return game;
  }

  private response(game: Game, playerId: PlayerId): RoomSessionResponse {
    const token = this.sessions.create({ roomCode: game.roomCode, playerId });
    return { room: this.projector.room(game), session: { playerId, token } };
  }

  private newCode(): string {
    let code: string;
    do code = randomInt(100_000, 1_000_000).toString();
    while (this.games.get(code));
    return code;
  }
}
