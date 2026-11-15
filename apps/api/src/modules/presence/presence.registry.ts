import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import type { Presence } from "@mystery-game/contracts";
import type { PlayerId } from "@mystery-game/game";
import { PRESENCE_OPTIONS, type PresenceOptions } from "./presence.options.js";
import { TIMER, type Timer } from "./timer.js";

interface Entry {
  sockets: number;
  status: Presence;
  cancelGrace: (() => void) | null;
}

/**
 * Connection bookkeeping per (room, player): connected socket count, presence
 * status and the grace timer. Knows nothing about game rules – the caller
 * decides what happens when the grace period expires.
 */
@Injectable()
export class PresenceRegistry implements OnModuleDestroy {
  private readonly rooms = new Map<string, Map<string, Entry>>();

  public constructor(
    @Inject(TIMER) private readonly timer: Timer,
    @Inject(PRESENCE_OPTIONS) private readonly options: PresenceOptions,
  ) {}

  /** Unknown players (no socket yet) count as offline. */
  public status(roomCode: string, playerId: string): Presence {
    return this.rooms.get(roomCode)?.get(playerId)?.status ?? "offline";
  }

  public away(roomCode: string): PlayerId[] {
    return [...(this.rooms.get(roomCode) ?? new Map<string, Entry>())]
      .filter(([, e]) => e.status === "away")
      .map(([id]) => id as PlayerId);
  }

  /** A new player who has not connected yet: starts the grace timer. */
  public expect(roomCode: string, playerId: string, onExpired: () => void): void {
    const entry = this.entry(roomCode, playerId);
    if (entry.sockets === 0 && !entry.cancelGrace) this.startGrace(entry, onExpired);
  }

  /** A socket connected. Returns true when the status changed. */
  public connected(roomCode: string, playerId: string): boolean {
    const entry = this.entry(roomCode, playerId);
    entry.sockets += 1;
    entry.cancelGrace?.();
    entry.cancelGrace = null;
    return this.setStatus(entry, "online");
  }

  /** A socket disconnected. Starts the grace timer after the last one. Returns true when the status changed. */
  public disconnected(roomCode: string, playerId: string, onExpired: () => void): boolean {
    const entry = this.rooms.get(roomCode)?.get(playerId);
    if (!entry) return false;
    entry.sockets = Math.max(0, entry.sockets - 1);
    if (entry.sockets > 0) return false;
    this.startGrace(entry, onExpired);
    return entry.status === "away" ? false : this.setStatus(entry, "offline");
  }

  /** Returns true when the status changed. */
  public markAway(roomCode: string, playerId: string): boolean {
    const entry = this.rooms.get(roomCode)?.get(playerId);
    if (!entry || entry.sockets > 0) return false;
    return this.setStatus(entry, "away");
  }

  public forget(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    room?.get(playerId)?.cancelGrace?.();
    room?.delete(playerId);
    if (room?.size === 0) this.rooms.delete(roomCode);
  }

  public forgetRoom(roomCode: string): void {
    for (const id of [...(this.rooms.get(roomCode)?.keys() ?? [])]) this.forget(roomCode, id);
  }

  public onModuleDestroy(): void {
    for (const code of [...this.rooms.keys()]) this.forgetRoom(code);
  }

  private entry(roomCode: string, playerId: string): Entry {
    let room = this.rooms.get(roomCode);
    if (!room) this.rooms.set(roomCode, (room = new Map()));
    let entry = room.get(playerId);
    if (!entry) room.set(playerId, (entry = { sockets: 0, status: "offline", cancelGrace: null }));
    return entry;
  }

  private startGrace(entry: Entry, onExpired: () => void): void {
    entry.cancelGrace?.();
    entry.cancelGrace = this.timer.schedule(this.options.graceMs, () => {
      entry.cancelGrace = null;
      onExpired();
    });
  }

  private setStatus(entry: Entry, status: Presence): boolean {
    if (entry.status === status) return false;
    entry.status = status;
    return true;
  }
}
