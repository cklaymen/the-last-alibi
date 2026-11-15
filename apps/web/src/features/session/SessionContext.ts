import { createContext, useContext } from "react";
import type { RoomSessionResponse, RoomSummary } from "@mystery-game/contracts";
import type { StoredSession } from "./storage.js";

export interface ActiveSession extends StoredSession {
  /** Room state from the REST response; the socket keeps it fresh afterwards. */
  initialRoom: RoomSummary;
}

export interface SessionContextValue {
  /** "restoring" while a stored session is being checked on app load. */
  status: "restoring" | "ready";
  session: ActiveSession | null;
  /** Stores the session returned by create/join. */
  begin: (response: RoomSessionResponse) => void;
  /** Forgets the session (back to the join screen). */
  leave: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession() outside SessionProvider");
  return value;
}
