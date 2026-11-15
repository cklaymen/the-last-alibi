import { z } from "zod";
import type { ClientToServerEvents } from "@mystery-game/contracts";
import type { Game, GameResult, PlayerId, Rng } from "@mystery-game/game";
import type { DiceQueue } from "../rng.js";

/** Infrastructure a handler may use (injected; never global). */
export interface CommandDeps {
  readonly newRng: () => Rng;
  readonly diceQueue: DiceQueue;
  readonly newId: () => string;
}

/** Side effects a handler may request after its result was committed. */
export interface CommandEffects {
  /** Notifies the player with `room:kicked`, disconnects them and invalidates their session. */
  expel(playerId: PlayerId): void;
}

export type CommandEvent = keyof ClientToServerEvents;

export interface CommandHandler<S extends z.ZodType = z.ZodType> {
  readonly event: CommandEvent;
  readonly schema: S;
  execute(game: Game, playerId: PlayerId, payload: z.output<S>, deps: CommandDeps): GameResult;
  /** Runs after a successful, committed `execute`. */
  afterCommit?(payload: z.output<S>, effects: CommandEffects): void;
}

/** Type-checks a handler against its own schema and erases it for the registry. */
export const defineCommand = <S extends z.ZodType>(handler: CommandHandler<S>): CommandHandler =>
  handler as unknown as CommandHandler;

/** Payload of commands without arguments (`{}` or omitted). */
export const emptyPayloadSchema = z.object({}).optional();
