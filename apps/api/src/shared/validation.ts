import type { z } from "zod";
import { AppError } from "./app-error.js";

/** Parses `input` with a contract schema; throws AppError(INVALID_PAYLOAD) on failure. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError("INVALID_PAYLOAD");
  return result.data;
}
