import { Inject } from "@nestjs/common";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  chooseCharacterSchema,
  setReadySchema,
  startRoomSchema,
  subscribeRoomSchema,
  type RoomSummary,
} from "@mystery-game/contracts";
import { RoomsService } from "./rooms.service.js";

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" },
})
export class LobbyGateway {
  @WebSocketServer()
  private server!: Server;

  public constructor(
    @Inject(RoomsService) private readonly roomsService: RoomsService,
  ) {}

  @SubscribeMessage("room:subscribe")
  public subscribe(client: Socket, payload: unknown): void {
    const { roomCode } = subscribeRoomSchema.parse(payload);
    client.join(this.channel(roomCode));
    client.emit("room:state", this.roomsService.get(roomCode));
  }

  @SubscribeMessage("room:start")
  public start(client: Socket, payload: unknown): void {
    const { roomCode, playerName } = startRoomSchema.parse(payload);
    const room = this.roomsService.start(roomCode, playerName);
    this.publish(room);
    client.emit("room:started", room);
  }

  @SubscribeMessage("character:choose")
  public chooseCharacter(client: Socket, payload: unknown): void {
    try {
      const { roomCode, playerName, characterId } =
        chooseCharacterSchema.parse(payload);
      const room = this.roomsService.chooseCharacter(
        roomCode,
        playerName,
        characterId,
      );
      this.publish(room);
    } catch (err) {
      client.emit("room:error", {
        message: err instanceof Error ? err.message : "Action failed.",
      });
    }
  }

  @SubscribeMessage("player:ready")
  public setReady(client: Socket, payload: unknown): void {
    try {
      const { roomCode, playerName, isReady } = setReadySchema.parse(payload);
      const room = this.roomsService.setPlayerReady(
        roomCode,
        playerName,
        isReady,
      );
      this.publish(room);
    } catch (err) {
      client.emit("room:error", {
        message: err instanceof Error ? err.message : "Action failed.",
      });
    }
  }

  public publish(room: RoomSummary): void {
    this.server.to(this.channel(room.code)).emit("room:state", room);
  }

  private channel(roomCode: string): string {
    return `room:${roomCode}`;
  }
}
