import { errorCodes, type RoomSessionResponse } from "@mystery-game/contracts";
import { apiUrl } from "../../config.js";

/** Failed request. `code` is a server ErrorCode, or "connect" for network failures. */
export class ApiError extends Error {
  constructor(readonly code: string, readonly status = 0) {
    super(code);
  }
}

function readCode(body: unknown): string {
  if (typeof body === "object" && body !== null && "code" in body) {
    const { code } = body as { code: unknown };
    if (typeof code === "string" && (errorCodes as readonly string[]).includes(code))
      return code;
  }
  return "INTERNAL";
}

async function request<T = RoomSessionResponse>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, init);
  } catch {
    throw new ApiError("connect");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(readCode(body), response.status);
  return body as T;
}

const json = (body: object): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const roomsApi = {
  create: (playerName: string) => request("/rooms", json({ playerName })),
  join: (playerName: string, roomCode: string) =>
    request("/rooms/join", json({ playerName, roomCode })),
  restore: (roomCode: string, token: string) =>
    request(`/rooms/${encodeURIComponent(roomCode)}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  /**
   * Checks that a room exists (GET /rooms/:code). Rejects with ApiError
   * "ROOM_NOT_FOUND" when it does not; the body is not used.
   */
  check: (roomCode: string) =>
    request<unknown>(`/rooms/${encodeURIComponent(roomCode)}`).then(() => undefined),
};
