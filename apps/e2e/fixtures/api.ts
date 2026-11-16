import type { APIRequestContext } from "@playwright/test";
import { API_URL } from "./urls.js";

export { API_URL };

type Location =
  | { kind: "cell"; position: { row: number; col: number } }
  | { kind: "room"; roomId: string };

export interface Scenario {
  envelope?: { suspect: string; weapon: string; room: string };
  hands?: Record<string, string[]>;
  pawns?: Record<string, Location>;
  weapons?: Record<string, string>;
  dice?: [number, number][];
  activePlayer?: string;
  summonedTo?: Record<string, string>;
  settings?: Record<string, unknown>;
}

/** Sets up game state through the test-only API (ENABLE_TEST_API=1). */
export async function applyScenario(
  request: APIRequestContext,
  code: string,
  scenario: Scenario,
): Promise<void> {
  const response = await request.post(
    `${API_URL}/testing/rooms/${code}/scenario`,
    { data: scenario },
  );
  if (!response.ok())
    throw new Error(`scenario failed: ${response.status()} ${await response.text()}`);
}

export const room = (roomId: string): Location => ({ kind: "room", roomId });
export const cell = (row: number, col: number): Location => ({
  kind: "cell",
  position: { row, col },
});

/** Envelope + 3-player deal used by most scenarios (partitions all 21 cards). */
export const ENVELOPE = { suspect: "purple", weapon: "wrench", room: "study" };
export const HANDS_3 = {
  Ada: ["red", "yellow", "candlestick", "kitchen", "ballroom", "conservatory"],
  Bob: ["white", "green", "dagger", "lead_pipe", "dining_room", "billiard_room"],
  Cyd: ["blue", "revolver", "rope", "library", "lounge", "hall"],
};
export const HANDS_2 = {
  Ada: [...HANDS_3.Ada, "blue", "revolver", "rope"],
  Bob: [...HANDS_3.Bob, "library", "lounge", "hall"],
};
