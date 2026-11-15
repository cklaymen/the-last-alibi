import { Inject, Injectable } from "@nestjs/common";
import type { Server } from "socket.io";
import type { ServerToClientEvents } from "@mystery-game/contracts";

type EventName = keyof ServerToClientEvents;
type EventPayload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0];

/** Small emission interface (ISP): a room channel and a per-player channel. */
export interface GameNotifier {
  toRoom<E extends EventName>(roomCode: string, event: E, payload: EventPayload<E>): void;
  toPlayer<E extends EventName>(playerId: string, event: E, payload: EventPayload<E>): void;
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

  public toRoom<E extends EventName>(roomCode: string, event: E, payload: EventPayload<E>): void {
    this.ref.server?.to(roomChannel(roomCode)).emit(event, payload);
  }

  public toPlayer<E extends EventName>(playerId: string, event: E, payload: EventPayload<E>): void {
    this.ref.server?.to(playerChannel(playerId)).emit(event, payload);
  }
}
