import { useCallback, useRef, useState, type PointerEvent, type MouseEvent } from "react";
import {
  FULL_VIEW,
  isZoomed,
  panView,
  zoomView,
  type Box,
  type Point,
} from "./geometry.js";

const DRAG_THRESHOLD_PX = 5;
const BUTTON_ZOOM = 1.5;

/**
 * Zoom & pan for the board SVG by changing its viewBox: drag with one pointer
 * to pan (when zoomed), pinch with two pointers to zoom, plus +/-/reset.
 */
export function useBoardView() {
  const [view, setViewState] = useState<Box>(FULL_VIEW);
  const viewRef = useRef(view);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const moved = useRef(0);
  const dragged = useRef(false);

  const setView = useCallback((v: Box) => {
    viewRef.current = v;
    setViewState(v);
  }, []);

  /** SVG units per CSS pixel (preserveAspectRatio = meet). */
  const scale = (): number => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return 1;
    const v = viewRef.current;
    return Math.max(v.width / rect.width, v.height / rect.height);
  };

  const toSvg = (p: Point): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    const v = viewRef.current;
    if (!rect) return { x: v.x + v.width / 2, y: v.y + v.height / 2 };
    const s = scale();
    const offX = (rect.width - v.width / s) / 2;
    const offY = (rect.height - v.height / s) / 2;
    return { x: v.x + (p.x - rect.left - offX) * s, y: v.y + (p.y - rect.top - offY) * s };
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (pointers.current.size === 0) {
      moved.current = 0;
      dragged.current = false;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 1) {
      if (!isZoomed(viewRef.current)) return;
      moved.current += Math.abs(next.x - prev.x) + Math.abs(next.y - prev.y);
      pointers.current.set(e.pointerId, next);
      if (moved.current < DRAG_THRESHOLD_PX) return;
      if (!dragged.current) {
        dragged.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      const s = scale();
      setView(panView(viewRef.current, (next.x - prev.x) * s, (next.y - prev.y) * s));
      return;
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()];
      if (!a || !b) return;
      const other = a[0] === e.pointerId ? b[1] : a[1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      pointers.current.set(e.pointerId, next);
      if (before < 1) return;
      dragged.current = true;
      const mid = toSvg({ x: (next.x + other.x) / 2, y: (next.y + other.y) / 2 });
      setView(zoomView(viewRef.current, after / before, mid));
    }
  };

  const onPointerEnd = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
  };

  /** Swallows the click that ends a drag/pinch so it does not trigger a move. */
  const onClickCapture = (e: MouseEvent<SVGSVGElement>) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
      dragged.current = false;
    }
  };

  return {
    view,
    svgRef,
    zoomed: isZoomed(view),
    zoomIn: () => setView(zoomView(viewRef.current, BUTTON_ZOOM)),
    zoomOut: () => setView(zoomView(viewRef.current, 1 / BUTTON_ZOOM)),
    reset: () => setView(FULL_VIEW),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
    },
  };
}
