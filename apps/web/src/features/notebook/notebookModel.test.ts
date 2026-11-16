import { describe, expect, it } from "vitest";
import { cycleCell, cycleGeneral, cycleManual, effectiveMark, emptyManual, notebookKey, parseManual } from "./notebookModel.js";

describe("notebook model", () => {
  it("cycleManual order: auto → has → not → maybe → auto", () => {
    expect(cycleManual(undefined)).toBe("has");
    expect(cycleManual("has")).toBe("not");
    expect(cycleManual("not")).toBe("maybe");
    expect(cycleManual("maybe")).toBeUndefined();
  });

  it("manual mark wins over auto", () => {
    expect(effectiveMark("not", "has")).toEqual({ mark: "not", source: "manual" });
    expect(effectiveMark(undefined, "has")).toEqual({ mark: "has", source: "auto" });
    expect(effectiveMark("empty", undefined)).toEqual({ mark: "empty", source: "auto" });
  });

  it("only manual marks are stored; cycling back to auto removes the entry", () => {
    let s = cycleCell(emptyManual, "p2", "hall");
    expect(s.cells).toEqual({ p2: { hall: "has" } });
    for (let i = 0; i < 3; i++) s = cycleCell(s, "p2", "hall");
    expect(s.cells).toEqual({ p2: {} });
    expect(cycleGeneral(emptyManual, "rope").general).toEqual({ rope: "has" });
  });

  it("uses a v2 key and parses corrupt or v1 data as empty", () => {
    expect(notebookKey("g", "p")).toBe("notebook:v2:g:p");
    expect(parseManual("{bad")).toEqual(emptyManual);
    expect(parseManual(JSON.stringify({ marks: { hall: "has" }, auto: [] }))).toEqual(emptyManual);
    const s = { general: { hall: "not" }, cells: { p2: { rope: "maybe" } } };
    expect(parseManual(JSON.stringify(s))).toEqual(s);
  });
});
