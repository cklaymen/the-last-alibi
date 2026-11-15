import {
  COLS,
  ROWS,
  type Door,
  type Position,
  type Rect,
} from "@mystery-game/game";

/** Size of one board cell in SVG user units. */
export const CELL = 20;
export const BOARD_WIDTH = COLS * CELL;
export const BOARD_HEIGHT = ROWS * CELL;

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cellBox(p: Position): Box {
  return { x: p.col * CELL, y: p.row * CELL, width: CELL, height: CELL };
}

export function cellCenter(p: Position): Point {
  return { x: p.col * CELL + CELL / 2, y: p.row * CELL + CELL / 2 };
}

export function rectBox(r: Rect): Box {
  return {
    x: r.left * CELL,
    y: r.top * CELL,
    width: (r.right - r.left + 1) * CELL,
    height: (r.bottom - r.top + 1) * CELL,
  };
}

export type SlotKind = "pawn" | "weapon" | "label";

/** Maximum distance between two neighbouring slots. */
const SLOT_GAP = 16;

/**
 * Point inside a room for the n-th pawn / weapon (6 slots per row, so the six
 * pawns and six weapons never overlap) or for the room label.
 */
export function roomSlot(r: Rect, kind: SlotKind, index = 0): Point {
  const b = rectBox(r);
  const cx = b.x + b.width / 2;
  if (kind === "label") return { x: cx, y: b.y + b.height * 0.24 };
  const gap = Math.min(SLOT_GAP, (b.width - CELL) / 6);
  const x = cx + (index - 2.5) * gap;
  const y = b.y + b.height * (kind === "pawn" ? 0.52 : 0.78);
  return { x, y };
}

/** Line segment on the room wall facing the corridor cell in front of the door. */
export function doorSegment(door: Door): { x1: number; y1: number; x2: number; y2: number } {
  const { inside, outside } = door;
  const b = cellBox(inside);
  const inset = CELL * 0.15;
  if (outside.row < inside.row)
    return { x1: b.x + inset, y1: b.y, x2: b.x + b.width - inset, y2: b.y };
  if (outside.row > inside.row)
    return { x1: b.x + inset, y1: b.y + b.height, x2: b.x + b.width - inset, y2: b.y + b.height };
  if (outside.col < inside.col)
    return { x1: b.x, y1: b.y + inset, x2: b.x, y2: b.y + b.height - inset };
  return { x1: b.x + b.width, y1: b.y + inset, x2: b.x + b.width, y2: b.y + b.height - inset };
}

// ── Zoom / pan (viewBox arithmetic) ────────────────────────────────────────

export const FULL_VIEW: Box = { x: 0, y: 0, width: BOARD_WIDTH, height: BOARD_HEIGHT };
export const MIN_ZOOM_WIDTH = BOARD_WIDTH / 4;

/** Keeps a view inside the board and between 1× and 4× zoom. */
export function clampView(v: Box): Box {
  const width = Math.min(BOARD_WIDTH, Math.max(MIN_ZOOM_WIDTH, v.width));
  const height = (width * BOARD_HEIGHT) / BOARD_WIDTH;
  const x = Math.min(BOARD_WIDTH - width, Math.max(0, v.x));
  const y = Math.min(BOARD_HEIGHT - height, Math.max(0, v.y));
  return { x, y, width, height };
}

/** Zooms by `factor` (>1 zooms in) keeping `focus` (SVG units) in place. */
export function zoomView(v: Box, factor: number, focus?: Point): Box {
  const f = focus ?? { x: v.x + v.width / 2, y: v.y + v.height / 2 };
  const width = v.width / factor;
  const height = v.height / factor;
  return clampView({
    x: f.x - ((f.x - v.x) * width) / v.width,
    y: f.y - ((f.y - v.y) * height) / v.height,
    width,
    height,
  });
}

/** Moves the view by a delta given in SVG units. */
export function panView(v: Box, dx: number, dy: number): Box {
  return clampView({ ...v, x: v.x - dx, y: v.y - dy });
}

export function isZoomed(v: Box): boolean {
  return v.width < BOARD_WIDTH - 0.01;
}

export const viewBoxAttr = (v: Box): string => `${v.x} ${v.y} ${v.width} ${v.height}`;
