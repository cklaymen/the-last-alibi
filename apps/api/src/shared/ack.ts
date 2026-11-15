import { Logger } from "@nestjs/common";
import type { CommandResult } from "@mystery-game/contracts";
import { AppError } from "./app-error.js";

const logger = new Logger("Ack");

export type AckFn = (result: CommandResult) => void;

export const ackOk = (): CommandResult => ({ ok: true });

/** Maps any thrown value to a failed CommandResult (unexpected errors → INTERNAL, logged). */
export function ackError(err: unknown): CommandResult {
  if (err instanceof AppError) return { ok: false, code: err.code };
  logger.error(err);
  return { ok: false, code: "INTERNAL" };
}

/** Socket.IO passes the ack as the last argument; it may be missing. */
export function splitArgs(args: unknown[]): { payload: unknown; ack: AckFn } {
  const last = args[args.length - 1];
  const ack: AckFn = typeof last === "function" ? (last as AckFn) : () => undefined;
  const payload = typeof args[0] === "function" ? undefined : args[0];
  return { payload, ack };
}
