export interface PresenceOptions {
  /** How long a player may stay disconnected before becoming "away"/removed. */
  readonly graceMs: number;
}

export const PRESENCE_OPTIONS = Symbol("PRESENCE_OPTIONS");
export const DEFAULT_GRACE_MS = 30_000;

/** Reads `PRESENCE_GRACE_MS` (default 30 000 ms; invalid values fall back to it). */
export function presenceOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): PresenceOptions {
  const raw = Number(env.PRESENCE_GRACE_MS);
  const graceMs = env.PRESENCE_GRACE_MS !== undefined && Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_GRACE_MS;
  return { graceMs };
}
