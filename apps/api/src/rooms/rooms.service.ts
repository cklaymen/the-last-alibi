import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  chooseCharacter as gameChooseCharacter,
  createGame,
  gameId,
  joinGame,
  playerId,
  roomCode as gameRoomCode,
  setPlayerReady as gameSetPlayerReady,
  type CharacterId,
  type Game,
  type Player,
  type PlayerId,
} from "@mystery-game/game";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomSummary,
} from "@mystery-game/contracts";

interface RoomStore {
  game: Game;
  /** Maps player nickname to their authoritative PlayerId. */
  playerIdByName: Map<string, PlayerId>;
}

@Injectable()
export class RoomsService {
  private readonly rooms = new Map<string, RoomStore>();

  public create(request: CreateRoomRequest): RoomSummary {
    const code = this.createCode();
    const hostId = playerId(crypto.randomUUID());
    const host: Player = {
      id: hostId,
      name: request.playerName,
      isReady: false,
    };
    const game = createGame(
      gameId(crypto.randomUUID()),
      gameRoomCode(code),
      host,
    );
    this.rooms.set(code, {
      game,
      playerIdByName: new Map([[request.playerName, hostId]]),
    });
    return this.toSummary(game);
  }

  public join(request: JoinRoomRequest): RoomSummary {
    const store = this.rooms.get(request.roomCode);
    if (!store) throw new NotFoundException("No room exists with that code.");

    if (store.playerIdByName.has(request.playerName)) {
      return this.toSummary(store.game);
    }

    const newId = playerId(crypto.randomUUID());
    const result = joinGame(store.game, {
      id: newId,
      name: request.playerName,
      isReady: false,
    });
    if (!result.ok) {
      throw new BadRequestException(
        result.reason === "GAME_FULL" ? "The room is full." : "Join failed.",
      );
    }
    store.game = result.game;
    store.playerIdByName.set(request.playerName, newId);
    return this.toSummary(store.game);
  }

  public get(roomCode: string): RoomSummary {
    const store = this.rooms.get(roomCode);
    if (!store) throw new NotFoundException("No room exists with that code.");
    return this.toSummary(store.game);
  }

  public start(roomCode: string, playerName: string): RoomSummary {
    const store = this.rooms.get(roomCode);
    if (!store) throw new NotFoundException("No room exists with that code.");
    const pid = store.playerIdByName.get(playerName);
    if (!pid || store.game.hostId !== pid) {
      throw new BadRequestException("Only the room host can start the game.");
    }
    if (store.game.players.length < 2) {
      throw new BadRequestException(
        "At least 2 players are required to start.",
      );
    }
    store.game = { ...store.game, phase: "IN_PROGRESS" };
    return this.toSummary(store.game);
  }

  public chooseCharacter(
    roomCode: string,
    playerName: string,
    characterId: CharacterId,
  ): RoomSummary {
    const store = this.rooms.get(roomCode);
    if (!store) throw new NotFoundException("No room exists with that code.");
    const pid = store.playerIdByName.get(playerName);
    if (!pid) throw new NotFoundException("Player not found.");
    const result = gameChooseCharacter(store.game, pid, characterId);
    if (!result.ok) {
      throw new BadRequestException(
        result.reason === "CHARACTER_TAKEN"
          ? "That character is already taken."
          : "Character choice failed.",
      );
    }
    store.game = result.game;
    return this.toSummary(store.game);
  }

  public setPlayerReady(
    roomCode: string,
    playerName: string,
    isReady: boolean,
  ): RoomSummary {
    const store = this.rooms.get(roomCode);
    if (!store) throw new NotFoundException("No room exists with that code.");
    const pid = store.playerIdByName.get(playerName);
    if (!pid) throw new NotFoundException("Player not found.");
    const result = gameSetPlayerReady(store.game, pid, isReady);
    if (!result.ok) {
      throw new BadRequestException(
        result.reason === "GAME_NOT_READY"
          ? "Choose a character before marking yourself ready."
          : "Ready change failed.",
      );
    }
    store.game = result.game;
    return this.toSummary(store.game);
  }

  private createCode(): string {
    let code = "";
    do {
      const rnd = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
      code = (100_000 + (rnd % 900_000)).toString();
    } while (this.rooms.has(code));
    return code;
  }

  private toSummary(game: Game): RoomSummary {
    const hostPlayer = game.players.find((p) => p.id === game.hostId);
    return {
      id: game.id as string,
      code: game.roomCode as string,
      hostName: hostPlayer?.name ?? "",
      playerCount: game.players.length,
      maxPlayers: 6,
      phase: game.phase === "FINISHED" ? "FINISHED" : game.phase,
      players: game.players.map((p) => ({
        id: p.id as string,
        name: p.name,
        ...(p.characterId !== undefined ? { characterId: p.characterId } : {}),
        isReady: p.isReady,
      })),
    };
  }
}
