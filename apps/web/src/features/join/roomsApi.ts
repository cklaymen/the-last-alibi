import type { RoomSummary } from "@mystery-game/contracts";
import { apiUrl } from "../../config.js";
import { t } from "../../i18n/index.js";

async function post(path: string, body: object): Promise<RoomSummary> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(readMessage(payload));
  return payload as RoomSummary;
}

export const createRoom = (playerName: string) =>
  post("/rooms", { playerName });

export const joinRoom = (playerName: string, roomCode: string) =>
  post("/rooms/join", { playerName, roomCode });

function readMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  )
    return payload.message;
  return t("err_action");
}
