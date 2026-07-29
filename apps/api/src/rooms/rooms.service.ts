import { Injectable, NotFoundException } from "@nestjs/common";
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
      playerNames: [request.playerName],
    };
    this.rooms.set(room.code, room);
    return this.summary(room);
  }

  public join(request: JoinRoomRequest): RoomSummary {
    const room = this.rooms.get(request.roomCode);
    if (!room) {
      throw new NotFoundException("Nie znaleziono pokoju o tym kodzie.");
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

  private createCode(): string {
    const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    const digits = randomValue % 100;
    return `MYST-${digits.toString().padStart(2, "0")}`;
  }

  private summary(room: Room): RoomSummary {
    const { playerNames: _playerNames, ...summary } = room;
    return summary;
  }
}
