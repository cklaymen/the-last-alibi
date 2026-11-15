import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { PlayerId, RoomCode } from "@mystery-game/game";

export interface SessionRecord {
  readonly roomCode: RoomCode;
  readonly playerId: PlayerId;
}

export interface SessionRepository {
  /** Issues a new opaque token bound to the player. */
  create(record: SessionRecord): string;
  find(token: string): SessionRecord | undefined;
  /** Invalidates every token of the player (removed or kicked). */
  deletePlayer(roomCode: string, playerId: string): void;
  /** Invalidates every token of the room (room deleted). */
  deleteRoom(roomCode: string): void;
}

export const SESSION_REPOSITORY = Symbol("SESSION_REPOSITORY");

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, SessionRecord>();

  public create(record: SessionRecord): string {
    const token = randomUUID();
    this.sessions.set(token, record);
    return token;
  }

  public find(token: string): SessionRecord | undefined {
    return this.sessions.get(token);
  }

  public deletePlayer(roomCode: string, playerId: string): void {
    this.deleteWhere((r) => r.roomCode === roomCode && r.playerId === playerId);
  }

  public deleteRoom(roomCode: string): void {
    this.deleteWhere((r) => r.roomCode === roomCode);
  }

  private deleteWhere(predicate: (record: SessionRecord) => boolean): void {
    for (const [token, record] of this.sessions) if (predicate(record)) this.sessions.delete(token);
  }
}
