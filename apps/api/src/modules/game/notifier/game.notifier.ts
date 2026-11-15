import { Inject, Injectable } from "@nestjs/common";
import type { Server } from "socket.io";
import type { ServerToClientEvents } from "@mystery-game/contracts";

type EventName = keyof ServerToClientEvents;
type EventArgs<E extends EventName> = Parameters<ServerToClientEvents[E]>;

/** Small emission interface (ISP): a room channel and a per-player channel. */
export interface GameNotifier {
  toRoom<E extends EventName>(roomCode: string, event: E, ...args: EventArgs<E>): void;
  toPlayer<E extends EventName>(playerId: string, event: E, ...args: EventArgs<E>): void;
}

export const GAME_NOTIFIER = Symbol("GAME_NOTIFIER");

export const roomChannel = (roomCode: string): string => `room:${roomCode}`;
export const playerChannel = (playerId: string): string => `player:${playerId}`;

/** Holds the Socket.IO server once the gateway is initialised. */
@Injectable()
export class SocketServerRef {
  public server: Server | null = null;
}

@Injectable()
export class SocketIoGameNotifier implements GameNotifier {
  public constructor(@Inject(SocketServerRef) private readonly ref: SocketServerRef) {}

  public toRoom<E extends EventName>(roomCode: string, event: E, ...args: EventArgs<E>): void {
    this.ref.server?.to(roomChannel(roomCode)).emit(event, ...args);
  }

  public toPlayer<E extends EventName>(playerId: string, event: E, ...args: EventArgs<E>): void {
    this.ref.server?.to(playerChannel(playerId)).emit(event, ...args);
  }
}

/** Forcibly closes a player's sockets (kicked / removed). */
export interface ConnectionControl {
  disconnectPlayer(playerId: string): void;
}

export const CONNECTION_CONTROL = Symbol("CONNECTION_CONTROL");

@Injectable()
export class SocketIoConnectionControl implements ConnectionControl {
  public constructor(@Inject(SocketServerRef) private readonly ref: SocketServerRef) {}

  public disconnectPlayer(playerId: string): void {
    // `false`: send a disconnect packet after already queued events (e.g. room:kicked).
    this.ref.server?.in(playerChannel(playerId)).disconnectSockets(false);
  }
}
