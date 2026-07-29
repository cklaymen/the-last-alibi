import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomSummary,
} from "@mystery-game/contracts";

interface Room extends RoomSummary {
  readonly playerNames: string[];
}

@Injectable()
export class RoomsService {
  private readonly rooms = new Map<string, Room>();

  public create(request: CreateRoomRequest): RoomSummary {
    const room: Room = {
      id: crypto.randomUUID(),
      code: this.createCode(),
      hostName: request.playerName,
      playerCount: 1,
      maxPlayers: 6,
      phase: "LOBBY",
      playerNames: [request.playerName],
    };
    this.rooms.set(room.code, room);
    return this.summary(room);
  }

  public join(request: JoinRoomRequest): RoomSummary {
    const room = this.rooms.get(request.roomCode);
    if (!room) {
      throw new NotFoundException("No room exists with that code.");
    }
    if (
      !room.playerNames.includes(request.playerName) &&
      room.playerCount < room.maxPlayers
    ) {
      room.playerNames.push(request.playerName);
      room.playerCount += 1;
    }
    return this.summary(room);
  }

  public get(roomCode: string): RoomSummary {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new NotFoundException("No room exists with that code.");
    }
    return this.summary(room);
  }

  public start(roomCode: string, playerName: string): RoomSummary {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new NotFoundException("No room exists with that code.");
    }
    if (room.hostName !== playerName) {
      throw new BadRequestException("Only the room host can start the game.");
    }
    if (room.playerCount < 2) {
      throw new BadRequestException(
        "At least 2 players are required to start.",
      );
    }
    room.phase = "IN_PROGRESS";
    return this.summary(room);
  }

  private createCode(): string {
    let code = "";
    do {
      const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
      code = `MYST-${(randomValue % 100).toString().padStart(2, "0")}`;
    } while (this.rooms.has(code));
    return code;
  }

  private summary(room: Room): RoomSummary {
    const { playerNames: _playerNames, ...summary } = room;
    return summary;
  }
}
