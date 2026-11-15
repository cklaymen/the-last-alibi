import { createContext, useContext } from "react";
import type { RoomSessionResponse, RoomSummary } from "@mystery-game/contracts";
import type { StoredSession } from "./storage.js";

export interface ActiveSession extends StoredSession {
  /** Room state from the REST response; the socket keeps it fresh afterwards. */
  initialRoom: RoomSummary;
}

/**
 * Why the session ended, shown as an alert on the next screen (an errorText code):
 * "kicked" – the host removed the player; "UNAUTHORIZED" – the server forgot the session.
 */
export type SessionNotice = "kicked" | "UNAUTHORIZED";

export interface SessionContextValue {
  /** "restoring" while a stored session is being checked. */
  status: "restoring" | "ready";
  session: ActiveSession | null;
  /** Set after a session ended for a reason the player should see. */
  notice: SessionNotice | null;
  /** Stores the session returned by create/join and opens `/room/<code>`. */
  begin: (response: RoomSessionResponse) => void;
  /** Forgets the session and goes to `/` (optionally with a notice, e.g. "kicked"). */
  leave: (notice?: SessionNotice) => void;
  /** Forgets a session the server rejected but stays on the room URL (join-by-link form). */
  expire: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession() outside SessionProvider");
  return value;
}
