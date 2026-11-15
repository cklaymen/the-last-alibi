import { describe, expect, it } from "vitest";
import {
  autoMark,
  cycle,
  emptyNotebook,
  loadNotebook,
  markOf,
  nextMark,
  notebookKey,
  saveNotebook,
} from "./notebookModel.js";

describe("notebook model", () => {
  it("cycles empty → has → not → maybe → empty", () => {
    expect(nextMark("empty")).toBe("has");
    expect(nextMark("has")).toBe("not");
    expect(nextMark("not")).toBe("maybe");
    expect(nextMark("maybe")).toBe("empty");
    let s = emptyNotebook;
    for (const expected of ["has", "not", "maybe", "empty"] as const) {
      s = cycle(s, "rope");
      expect(markOf(s, "rope")).toBe(expected);
    }
  });

  it("pre-marks known cards as has only when empty", () => {
    let s = cycle(cycle(emptyNotebook, "hall"), "hall"); // hall = not
    s = autoMark(s, ["red", "hall"]);
    expect(markOf(s, "red")).toBe("has");
    expect(markOf(s, "hall")).toBe("not");
  });

  it("does not re-mark a card the player changed afterwards", () => {
    let s = autoMark(emptyNotebook, ["dagger"]);
    s = cycle(cycle(cycle(s, "dagger"), "dagger"), "dagger"); // back to empty
    expect(markOf(s, "dagger")).toBe("empty");
    s = autoMark(s, ["dagger", "study"]);
    expect(markOf(s, "dagger")).toBe("empty");
    expect(markOf(s, "study")).toBe("has");
  });

  it("is keyed by game and player and survives a reload", () => {
    expect(notebookKey("g1", "p1")).toBe("notebook:g1:p1");
    const key = notebookKey("g1", "p1");
    saveNotebook(key, cycle(emptyNotebook, "kitchen"));
    expect(markOf(loadNotebook(key), "kitchen")).toBe("has");
    expect(loadNotebook(notebookKey("g2", "p1"))).toEqual(emptyNotebook);
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem("notebook:x:y", "{nope");
    expect(loadNotebook("notebook:x:y")).toEqual(emptyNotebook);
  });
});
