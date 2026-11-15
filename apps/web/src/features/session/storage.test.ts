import { describe, expect, it } from "vitest";
import {
  clearSession,
  LAST_ROOM_KEY,
  loadLastSession,
  loadSession,
  saveSession,
  sessionKey,
} from "./storage.js";

const a = { roomCode: "1234", token: "t-a", playerId: "p-a" };
const b = { roomCode: "5678", token: "t-b", playerId: "p-b" };

describe("session storage", () => {
  it("stores one session per room and points to the last room", () => {
    saveSession(a);
    saveSession(b);
    expect(loadSession("1234")).toEqual(a);
    expect(loadSession("5678")).toEqual(b);
    expect(localStorage.getItem(LAST_ROOM_KEY)).toBe("5678");
    expect(loadLastSession()).toEqual(b);
  });

  it("clear removes the session and the last-room pointer", () => {
    saveSession(a);
    clearSession("1234");
    expect(loadSession("1234")).toBeNull();
    expect(loadLastSession()).toBeNull();
  });

  it("clearing another room keeps the last-room pointer", () => {
    saveSession(a);
    saveSession(b);
    clearSession("1234");
    expect(loadLastSession()).toEqual(b);
  });

  it("rejects malformed entries", () => {
    localStorage.setItem(sessionKey("9999"), JSON.stringify({ token: 1 }));
    expect(loadSession("9999")).toBeNull();
    localStorage.setItem(sessionKey("9998"), "not json");
    expect(loadSession("9998")).toBeNull();
  });
});
