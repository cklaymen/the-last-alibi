export { SessionModule } from "./session.module.js";
export {
  SESSION_REPOSITORY,
  type SessionRecord,
  type SessionRepository,
} from "./session.repository.js";

/** Extracts the token from an `Authorization: Bearer <token>` header. */
export function bearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  return match?.[1]?.trim();
}
