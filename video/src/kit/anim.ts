import { Easing, interpolate, spring } from "remotion";

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 over [start, start + duration] with an ease-out curve, clamped. */
export function progress(
  frame: number,
  start: number,
  duration = 18,
  easing: (t: number) => number = easeOut,
): number {
  if (duration <= 0) return frame >= start ? 1 : 0;
  return interpolate(frame, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Spring-based entrance (0 → 1, may overshoot slightly). */
export function pop(frame: number, start: number, fps: number, damping = 14): number {
  return spring({ frame: frame - start, fps, config: { damping, stiffness: 140, mass: 0.8 } });
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], Math.min(1, Math.max(0, t)))));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Opacity for an element that is visible during [start, end) with short fades. */
export function window(frame: number, start: number, end: number, fade = 10): number {
  const fadeIn = progress(frame, start, fade);
  const fadeOut = 1 - progress(frame, end - fade, fade);
  return Math.min(fadeIn, fadeOut);
}
