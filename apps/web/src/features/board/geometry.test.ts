import { describe, expect, it } from "vitest";
import { DOORS, ROOM_RECTS } from "@mystery-game/game";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL,
  FULL_VIEW,
  MIN_ZOOM_WIDTH,
  clampView,
  doorSegment,
  isZoomed,
  panView,
  roomSlot,
  zoomView,
} from "./geometry.js";

describe("board geometry", () => {
  it("draws a door on the room wall facing the corridor", () => {
    const kitchenBottom = DOORS.find((d) => d.roomId === "kitchen" && d.outside.row === 6)!;
    const seg = doorSegment(kitchenBottom);
    expect(seg.y1).toBe(6 * CELL);
    expect(seg.y2).toBe(6 * CELL);
    const kitchenRight = DOORS.find((d) => d.roomId === "kitchen" && d.outside.col === 6)!;
    expect(doorSegment(kitchenRight).x1).toBe(6 * CELL);
  });

  it("gives six distinct slots inside every room", () => {
    for (const rect of Object.values(ROOM_RECTS)) {
      const xs = [0, 1, 2, 3, 4, 5].map((i) => roomSlot(rect, "pawn", i).x);
      expect(new Set(xs).size).toBe(6);
      for (const x of xs) {
        expect(x).toBeGreaterThan(rect.left * CELL);
        expect(x).toBeLessThan((rect.right + 1) * CELL);
      }
    }
  });

  it("zooms around the centre and clamps to 4×", () => {
    const z = zoomView(FULL_VIEW, 2);
    expect(z.width).toBe(BOARD_WIDTH / 2);
    expect(z.x).toBe(BOARD_WIDTH / 4);
    expect(isZoomed(z)).toBe(true);
    expect(zoomView(FULL_VIEW, 100).width).toBe(MIN_ZOOM_WIDTH);
    expect(zoomView(z, 0.1)).toEqual(FULL_VIEW);
  });

  it("keeps the aspect ratio and stays inside the board when panning", () => {
    const z = zoomView(FULL_VIEW, 2);
    expect(z.height / z.width).toBeCloseTo(BOARD_HEIGHT / BOARD_WIDTH);
    expect(panView(z, 10_000, 10_000)).toMatchObject({ x: 0, y: 0 });
    const far = panView(z, -10_000, -10_000);
    expect(far.x + far.width).toBe(BOARD_WIDTH);
    expect(far.y + far.height).toBeCloseTo(BOARD_HEIGHT);
    expect(clampView({ x: -5, y: -5, width: 1e6, height: 1 })).toEqual(FULL_VIEW);
  });
});
