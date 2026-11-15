import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { RoomSessionResponse } from "@mystery-game/contracts";
import {
  homePath,
  navigate,
  parseRoute,
  roomPath,
  useRoute,
  type Route,
} from "../../shared/lib/router/index.js";
import { ApiError, roomsApi } from "./roomsApi.js";
import {
  SessionContext,
  type ActiveSession,
  type SessionContextValue,
  type SessionNotice,
} from "./SessionContext.js";
import {
  clearSession,
  loadLastSession,
  loadSession,
  saveSession,
  type StoredSession,
} from "./storage.js";

function toActive(response: RoomSessionResponse): ActiveSession {
  return {
    roomCode: response.room.code,
    token: response.session.token,
    playerId: response.session.playerId,
    initialRoom: response.room,
  };
}

const routeKey = (route: Route) => (route.name === "room" ? route.code : "");

/** What to restore for a route: the room's session, or (only at `/`) this tab's last room. */
function storedFor(route: Route): StoredSession | null {
  return route.name === "room" ? loadSession(route.code) : loadLastSession();
}

/**
 * Owns the player's session and keeps it in sync with the URL:
 * `/room/<code>` restores the stored session for that room (tab first, then the
 * browser-wide fallback) via GET /rooms/:code/session; `/` restores this tab's
 * last room once on load and redirects to it.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const route = useRoute();
  const key = routeKey(route);
  const [status, setStatus] = useState<"restoring" | "ready">(() =>
    storedFor(parseRoute(window.location.pathname)) ? "restoring" : "ready",
  );
  const [session, setSessionState] = useState<ActiveSession | null>(null);
  // A notice belongs to the route it was raised for (so it disappears on navigation).
  const [notice, setNotice] = useState<{ code: SessionNotice; at: string } | null>(null);
  const sessionRef = useRef<ActiveSession | null>(null);
  const handledKey = useRef<string | null>(null);
  const requestId = useRef(0);

  const setSession = useCallback((next: ActiveSession | null) => {
    sessionRef.current = next;
    setSessionState(next);
  }, []);

  useEffect(() => {
    // Runs once per route change (also guards StrictMode's double effect).
    if (handledKey.current === key) return;
    const firstRun = handledKey.current === null;
    handledKey.current = key;
    const id = ++requestId.current;
    const current = sessionRef.current;

    if (current && current.roomCode === key) {
      setStatus("ready");
      return;
    }
    if (current) setSession(null);

    // At `/` only the initial page load restores the last room; later visits to `/` don't.
    const stored = key ? loadSession(key) : firstRun ? loadLastSession() : null;
    if (!stored) {
      setStatus("ready");
      return;
    }
    setStatus("restoring");
    roomsApi
      .restore(stored.roomCode, stored.token)
      .then((response) => {
        if (id !== requestId.current) return;
        const active = toActive(response);
        saveSession({ roomCode: active.roomCode, token: active.token, playerId: active.playerId });
        setSession(active);
        setNotice(null);
        if (!key) navigate(roomPath(active.roomCode), { replace: true });
      })
      .catch((error: unknown) => {
        // Drop sessions the server no longer knows; keep them on network errors.
        if (error instanceof ApiError && (error.status === 401 || error.status === 404))
          clearSession(stored.roomCode, stored.token);
      })
      .finally(() => {
        if (id === requestId.current) setStatus("ready");
      });
  }, [key, setSession]);

  const begin = useCallback(
    (response: RoomSessionResponse) => {
      const active = toActive(response);
      saveSession({ roomCode: active.roomCode, token: active.token, playerId: active.playerId });
      requestId.current++;
      setNotice(null);
      setSession(active);
      setStatus("ready");
      navigate(roomPath(active.roomCode), { replace: true });
    },
    [setSession],
  );

  const drop = useCallback(() => {
    const current = sessionRef.current;
    if (current) clearSession(current.roomCode, current.token);
    requestId.current++;
    setSession(null);
    setStatus("ready");
  }, [setSession]);

  const leave = useCallback(
    (reason?: SessionNotice) => {
      drop();
      setNotice(reason ? { code: reason, at: "" } : null);
      navigate(homePath);
    },
    [drop],
  );

  const expire = useCallback(() => {
    drop();
    setNotice({ code: "UNAUTHORIZED", at: routeKey(parseRoute(window.location.pathname)) });
  }, [drop]);

  const visibleNotice = notice && notice.at === key ? notice.code : null;

  const value = useMemo<SessionContextValue>(
    () => ({ status, session, notice: visibleNotice, begin, leave, expire }),
    [status, session, visibleNotice, begin, leave, expire],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
