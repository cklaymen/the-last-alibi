import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RoomSessionResponse } from "@mystery-game/contracts";
import { ApiError, roomsApi } from "./roomsApi.js";
import { SessionContext, type ActiveSession } from "./SessionContext.js";
import { clearSession, loadLastSession, saveSession } from "./storage.js";

function toActive(response: RoomSessionResponse): ActiveSession {
  return {
    roomCode: response.room.code,
    token: response.session.token,
    playerId: response.session.playerId,
    initialRoom: response.room,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(loadLastSession);
  const [status, setStatus] = useState<"restoring" | "ready">(
    stored ? "restoring" : "ready",
  );
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    if (!stored) return;
    let cancelled = false;
    roomsApi
      .restore(stored.roomCode, stored.token)
      .then((response) => {
        if (!cancelled) setSession(toActive(response));
      })
      .catch((error: unknown) => {
        // Drop sessions the server no longer knows; keep them on network errors.
        if (error instanceof ApiError && (error.status === 401 || error.status === 404))
          clearSession(stored.roomCode);
      })
      .finally(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [stored]);

  const begin = useCallback((response: RoomSessionResponse) => {
    const active = toActive(response);
    const { roomCode, token, playerId } = active;
    saveSession({ roomCode, token, playerId });
    setSession(active);
  }, []);

  const leave = useCallback(() => {
    setSession((current) => {
      if (current) clearSession(current.roomCode);
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({ status, session, begin, leave }),
    [status, session, begin, leave],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
