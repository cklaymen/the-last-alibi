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
}
