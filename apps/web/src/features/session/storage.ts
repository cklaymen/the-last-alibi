/**
 * A player's session in one room.
 *
 * The primary copy lives in sessionStorage (per browser tab), so two tabs or
 * windows of the same browser can be different players in the same room.
 * A mirror per room code is kept in localStorage, so reopening a room link
 * after the tab was closed restores the player.
 */
export interface StoredSession {
  roomCode: string;
  token: string;
  playerId: string;
}

export const sessionKey = (roomCode: string) => `session:${roomCode}`;
export const LAST_ROOM_KEY = "session:last";

type Area = "tab" | "local";

function storage(area: Area): Storage | null {
  try {
    return area === "tab" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function read(area: Area, key: string): string | null {
  try {
    return storage(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(area: Area, key: string, value: string | null): void {
  try {
    const s = storage(area);
    if (value === null) s?.removeItem(key);
    else s?.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.roomCode === "string" &&
    typeof v.token === "string" &&
    typeof v.playerId === "string"
  );
}

function parse(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const loadTabSession = (roomCode: string) => parse(read("tab", sessionKey(roomCode)));
export const loadLocalSession = (roomCode: string) => parse(read("local", sessionKey(roomCode)));

/** This tab's session for the room, else the browser-wide fallback. */
export function loadSession(roomCode: string): StoredSession | null {
  return loadTabSession(roomCode) ?? loadLocalSession(roomCode);
}

/**
 * The session of the room this tab was in most recently. Deliberately tab-only:
 * a fresh tab at `/` must not silently become the player of another tab.
 */
export function loadLastSession(): StoredSession | null {
  const code = read("tab", LAST_ROOM_KEY);
  return code ? loadTabSession(code) : null;
}

export function saveSession(session: StoredSession): void {
  const value = JSON.stringify(session);
  write("tab", sessionKey(session.roomCode), value);
  write("tab", LAST_ROOM_KEY, session.roomCode);
  write("local", sessionKey(session.roomCode), value);
}

/**
 * Forgets the session of a room in this tab. The localStorage mirror is removed
 * only when it belongs to the same player (`token`), so one tab leaving does not
 * break another tab that later reopens the link.
 */
export function clearSession(roomCode: string, token?: string): void {
  write("tab", sessionKey(roomCode), null);
  if (read("tab", LAST_ROOM_KEY) === roomCode) write("tab", LAST_ROOM_KEY, null);
  const local = loadLocalSession(roomCode);
  if (local && (token === undefined || local.token === token))
    write("local", sessionKey(roomCode), null);
}
