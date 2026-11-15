import type { Rng } from "./types.js";

/** Integer in [0, n). Clamped so a misbehaving rng returning 1 stays in range. */
export function randomInt(rng: Rng, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.floor(rng() * n)));
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[randomInt(rng, items.length)] as T;
}

/** Fisher–Yates; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}
