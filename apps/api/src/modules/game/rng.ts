import { Injectable } from "@nestjs/common";
import type { Rng } from "@mystery-game/game";

/** Produces a fresh `Rng` per call. Default: Math.random (infrastructure only). */
export type RngFactory = () => Rng;
export const RNG_FACTORY = Symbol("RNG_FACTORY");
export const defaultRngFactory: RngFactory = () => Math.random;

export type DicePair = readonly [number, number];

/** Scripted dice for tests (room code → queued pairs). */
@Injectable()
export class DiceQueue {
  private readonly queues = new Map<string, DicePair[]>();

  public enqueue(roomCode: string, pairs: readonly DicePair[]): void {
    this.queues.set(roomCode, [...(this.queues.get(roomCode) ?? []), ...pairs]);
  }

  public peek(roomCode: string): DicePair | undefined {
    return this.queues.get(roomCode)?.[0];
  }

  public shift(roomCode: string): void {
    this.queues.get(roomCode)?.shift();
  }
}

/** Rng that makes `floor(rng() * 6) + 1` yield the given dice, then falls back. */
export function scriptedDiceRng(pair: DicePair, fallback: Rng): Rng {
  const values = pair.map((v) => (v - 1) / 6 + 0.01);
  return () => values.shift() ?? fallback();
}
