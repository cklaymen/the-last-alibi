/** A player's session in one room, kept in localStorage so a refresh restores it. */
export interface StoredSession {
  roomCode: string;
  token: string;
  playerId: string;
}

export const sessionKey = (roomCode: string) => `session:${roomCode}`;
export const LAST_ROOM_KEY = "session:last";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
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

export function loadSession(roomCode: string): StoredSession | null {
  const raw = read(sessionKey(roomCode));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The session of the room the player was in most recently. */
export function loadLastSession(): StoredSession | null {
  const code = read(LAST_ROOM_KEY);
  return code ? loadSession(code) : null;
}

export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(sessionKey(session.roomCode), JSON.stringify(session));
    localStorage.setItem(LAST_ROOM_KEY, session.roomCode);
  } catch {
    /* storage unavailable */
  }
}

export function clearSession(roomCode: string): void {
  try {
    localStorage.removeItem(sessionKey(roomCode));
    if (read(LAST_ROOM_KEY) === roomCode) localStorage.removeItem(LAST_ROOM_KEY);
  } catch {
    /* storage unavailable */
  }
}
