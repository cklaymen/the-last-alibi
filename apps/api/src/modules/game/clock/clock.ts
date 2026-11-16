/** Current time in ms (DIP: tests may inject a fake). */
export interface Clock {
  now(): number;
}

export const CLOCK = Symbol("CLOCK");

export const systemClock: Clock = { now: () => Date.now() };
