import { Inject, Logger } from "@nestjs/common";
import {
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { playerId as toPlayerId } from "@mystery-game/game";
import { ackError, ackOk, splitArgs } from "../../shared/ack.js";
import { SESSION_REPOSITORY, type SessionRepository } from "../session/index.js";
import { commandHandlers } from "./commands/index.js";
import { GameService } from "./game.service.js";
import { playerChannel, roomChannel, SocketServerRef } from "./notifier/game.notifier.js";
import { GameProjector } from "./projection/game.projector.js";

interface SocketData {
  playerId: string;
  roomCode: string;
}

/** Transport only: authenticates sockets, parses commands, sends acks, reports presence. */
@WebSocketGateway({
  // Default Socket.IO path `/socket.io` (nginx proxies it as-is).
  path: "/socket.io",
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  public constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(GameService) private readonly gameService: GameService,
    @Inject(GameProjector) private readonly projector: GameProjector,
    @Inject(SocketServerRef) private readonly serverRef: SocketServerRef,
  ) {}

  public afterInit(server: Server): void {
    this.serverRef.server = server;
    server.use((socket, next) => {
      const auth = socket.handshake.auth as { token?: unknown } | undefined;
      const token = typeof auth?.token === "string" ? auth.token : "";
      const session = this.sessions.find(token);
      if (!session || !this.gameService.hasPlayer(session.roomCode, session.playerId)) {
        next(new Error("UNAUTHORIZED"));
        return;
      }
      const data = socket.data as SocketData;
      data.playerId = session.playerId;
      data.roomCode = session.roomCode;
      next();
    });
  }

  public handleConnection(socket: Socket): void {
    const { playerId, roomCode } = socket.data as SocketData;
    if (!playerId) {
      socket.disconnect(true);
      return;
    }
    void socket.join([roomChannel(roomCode), playerChannel(playerId)]);

    for (const handler of commandHandlers) {
      socket.on(handler.event, (...args: unknown[]) => {
        const { payload, ack } = splitArgs(args);
        try {
          this.gameService.execute(roomCode, toPlayerId(playerId), handler, payload);
          ack(ackOk());
        } catch (err) {
          ack(ackError(err));
        }
      });
    }

    try {
      this.sendSnapshot(socket, roomCode, playerId);
      this.gameService.socketConnected(roomCode, toPlayerId(playerId));
    } catch (err) {
      this.logger.error(err);
    }
  }

  public handleDisconnect(socket: Socket): void {
    const { playerId, roomCode } = socket.data as Partial<SocketData>;
    if (!playerId || !roomCode) return;
    try {
      this.gameService.socketDisconnected(roomCode, toPlayerId(playerId));
    } catch (err) {
      this.logger.error(err);
    }
  }

  private sendSnapshot(socket: Socket, roomCode: string, playerId: string): void {
    const game = this.gameService.load(roomCode);
    socket.emit("room:state", this.projector.room(game));
    const pub = this.projector.publicState(game);
    const priv = this.projector.privateState(game, toPlayerId(playerId));
    if (pub) socket.emit("game:state", pub);
    if (priv) socket.emit("game:private", priv);
  }
}
