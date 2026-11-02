"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

export type View = { x: number; y: number; k: number };

const MIN_K = 0.15;
const MAX_K = 2.5;
const DRAG_THRESHOLD = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Drag = { id: number; startX: number; startY: number; lastX: number; lastY: number; active: boolean };

/**
 * Pan and zoom for a fixed-size canvas inside a resizable viewport.
 * Dragging only starts after a few pixels so clicks on the content still work,
 * and the click that ends a drag is swallowed. The wheel zooms with Ctrl/⌘
 * (or always, when `wheelZoom` is set); two fingers pinch.
 */
export function usePanZoom({ width, height, wheelZoom }: { width: number; height: number; wheelZoom: boolean }) {
  // A callback ref (stored in state) so the effects below re-run when the viewport remounts.
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [view, setViewState] = useState<View>({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const viewRef = useRef(view);
  const sizeRef = useRef({ w: 0, h: 0 });
  const contentRef = useRef({ width, height });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<Drag | null>(null);
  const pinch = useRef<number | null>(null);
  const swallowClick = useRef(false);

  useEffect(() => {
    contentRef.current = { width, height };
  }, [width, height]);

  const setView = useCallback((v: View) => {
    viewRef.current = v;
    setViewState(v);
  }, []);

  const fit = useCallback(() => {
    const { w, h } = sizeRef.current;
    const c = contentRef.current;
    if (!w || !h) return;
    const k = clamp(Math.min(w / c.width, h / c.height), MIN_K, MAX_K);
    setView({ k, x: (w - c.width * k) / 2, y: Math.max(0, (h - c.height * k) / 2) });
  }, [setView]);

  const zoomAt = useCallback(
    (factor: number, px?: number, py?: number) => {
      const v = viewRef.current;
      const { w, h } = sizeRef.current;
      const ox = px ?? w / 2;
      const oy = py ?? h / 2;
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const f = k / v.k;
      setView({ k, x: ox - (ox - v.x) * f, y: oy - (oy - v.y) * f });
    },
    [setView],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const v = viewRef.current;
      setView({ ...v, x: v.x + dx, y: v.y + dy });
    },
    [setView],
  );

  // Fit on first layout and whenever the viewport changes size (e.g. fullscreen).
  useEffect(() => {
    if (!viewport) return;
    sizeRef.current = { w: 0, h: 0 };
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const prev = sizeRef.current;
      sizeRef.current = { w, h };
      if (Math.abs(prev.w - w) > 1 || Math.abs(prev.h - h) > 1) fit();
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [viewport, fit]);

  // React's onWheel is passive, so preventDefault needs a native listener.
  useEffect(() => {
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      if (!(wheelZoom || e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const step = e.deltaMode === 1 ? 0.05 : 0.0015;
      zoomAt(Math.exp(-e.deltaY * step), e.clientX - rect.left, e.clientY - rect.top);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [viewport, wheelZoom, zoomAt]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, active: false };
      swallowClick.current = false;
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
      drag.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const p = pointers.current.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pinch.current !== null && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = e.currentTarget.getBoundingClientRect();
        if (pinch.current > 0) zoomAt(dist / pinch.current, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
        pinch.current = dist;
        swallowClick.current = true;
        return;
      }
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      if (!d.active) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
        d.active = true;
        swallowClick.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      panBy(e.clientX - d.lastX, e.clientY - d.lastY);
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    },
    [panBy, zoomAt],
  );

  const onPointerEnd = useCallback((e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId) {
      drag.current = null;
      setDragging(false);
    }
  }, []);

  const onClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      const step = 60;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => panBy(step, 0),
        ArrowRight: () => panBy(-step, 0),
        ArrowUp: () => panBy(0, step),
        ArrowDown: () => panBy(0, -step),
        "+": () => zoomAt(1.2),
        "=": () => zoomAt(1.2),
        "-": () => zoomAt(1 / 1.2),
        "0": fit,
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    },
    [fit, panBy, zoomAt],
  );

  return {
    viewportRef: setViewport,
    view,
    dragging,
    fit,
    zoomIn: useCallback(() => zoomAt(1.25), [zoomAt]),
    zoomOut: useCallback(() => zoomAt(1 / 1.25), [zoomAt]),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
      onKeyDown,
    },
  };
}
