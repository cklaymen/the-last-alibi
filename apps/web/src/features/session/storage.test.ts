import { describe, expect, it } from "vitest";
import {
  clearSession,
  LAST_ROOM_KEY,
  loadLastSession,
  loadLocalSession,
  loadSession,
  loadTabSession,
  saveSession,
  sessionKey,
} from "./storage.js";

const a = { roomCode: "1234", token: "t-a", playerId: "p-a" };
const b = { roomCode: "5678", token: "t-b", playerId: "p-b" };
const a2 = { roomCode: "1234", token: "t-a2", playerId: "p-a2" };

describe("session storage", () => {
  it("saves to the tab and mirrors to localStorage per room", () => {
    saveSession(a);
    saveSession(b);
    expect(loadTabSession("1234")).toEqual(a);
    expect(loadLocalSession("5678")).toEqual(b);
    expect(sessionStorage.getItem(LAST_ROOM_KEY)).toBe("5678");
    expect(loadLastSession()).toEqual(b);
  });

  it("prefers the tab session over the localStorage fallback", () => {
    saveSession(a);
    // another tab joined the same room later and overwrote the mirror
    localStorage.setItem(sessionKey("1234"), JSON.stringify(a2));
    expect(loadSession("1234")).toEqual(a);
  });

  it("falls back to localStorage when the tab has nothing (reopened link)", () => {
    saveSession(a);
    sessionStorage.clear();
    expect(loadSession("1234")).toEqual(a);
    // but a fresh tab at `/` does not adopt it as its last room
    expect(loadLastSession()).toBeNull();
  });

  it("clear removes the tab session and its own mirror", () => {
    saveSession(a);
    clearSession("1234", a.token);
    expect(loadSession("1234")).toBeNull();
    expect(loadLastSession()).toBeNull();
  });

  it("clear keeps a mirror that belongs to another tab's player", () => {
    saveSession(a);
    localStorage.setItem(sessionKey("1234"), JSON.stringify(a2));
    clearSession("1234", a.token);
    expect(loadTabSession("1234")).toBeNull();
    expect(loadLocalSession("1234")).toEqual(a2);
  });

  it("clearing another room keeps the last-room pointer", () => {
    saveSession(a);
    saveSession(b);
    clearSession("1234", a.token);
    expect(loadLastSession()).toEqual(b);
  });

  it("rejects malformed entries", () => {
    localStorage.setItem(sessionKey("9999"), JSON.stringify({ token: 1 }));
    expect(loadSession("9999")).toBeNull();
    sessionStorage.setItem(sessionKey("9998"), "not json");
    expect(loadSession("9998")).toBeNull();
  });
});
