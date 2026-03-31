/**
 * Pure utility functions for StorytellingMap.
 * Extracted for testability — the component imports these.
 */

import type { StoryStop } from "@/components/StorytellingMap";

// ── Math helpers ─────────────────────────────────────────────

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Title parsing ────────────────────────────────────────────

export function parseTitle(title: string) {
  const emojiMatch = title.match(
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u
  );
  const icon = emojiMatch ? emojiMatch[1] : "";
  const rest = emojiMatch ? title.slice(emojiMatch[0].length) : title;
  const dashIdx = rest.indexOf(" — ");
  if (dashIdx >= 0) {
    return {
      icon,
      place: rest.slice(0, dashIdx),
      subtitle: rest.slice(dashIdx + 3),
    };
  }
  return { icon, place: rest, subtitle: "" };
}

// ── Geo helpers ──────────────────────────────────────────────

export const SEG_PTS = 48;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const sl = Math.sin(dLat / 2);
  const sn = Math.sin(dLng / 2);
  const h =
    sl * sl +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      sn *
      sn;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function greatCircleArc(
  from: [number, number],
  to: [number, number],
  n: number
): [number, number][] {
  const toR = (d: number) => (d * Math.PI) / 180;
  const toD = (r: number) => (r * 180) / Math.PI;
  const [lat1, lng1] = [toR(from[0]), toR(from[1])];
  const [lat2, lng2] = [toR(to[0]), toR(to[1])];
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin((lng1 - lng2) / 2) ** 2
      )
    );
  if (d < 1e-10) return [from, to];
  const pts: [number, number][] = [];
  let prevLng = from[1];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x =
      a * Math.cos(lat1) * Math.cos(lng1) +
      b * Math.cos(lat2) * Math.cos(lng2);
    const y =
      a * Math.cos(lat1) * Math.sin(lng1) +
      b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    const lat = toD(Math.atan2(z, Math.sqrt(x * x + y * y)));
    let lng = toD(Math.atan2(y, x));
    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;
    prevLng = lng;
    pts.push([lat, lng]);
  }
  return pts;
}

export function catmullRomSegment(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  n: number,
  alpha = 0.5
): [number, number][] {
  const tj = (ti: number, a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return ti + Math.pow(dx * dx + dy * dy, alpha / 2);
  };
  const t0 = 0;
  const t1 = tj(t0, p0, p1);
  const t2 = tj(t1, p1, p2);
  const t3 = tj(t2, p2, p3);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = t1 + (i / n) * (t2 - t1);
    const a1L = ((t1 - t) / (t1 - t0)) * p0[0] + ((t - t0) / (t1 - t0)) * p1[0];
    const a1N = ((t1 - t) / (t1 - t0)) * p0[1] + ((t - t0) / (t1 - t0)) * p1[1];
    const a2L = ((t2 - t) / (t2 - t1)) * p1[0] + ((t - t1) / (t2 - t1)) * p2[0];
    const a2N = ((t2 - t) / (t2 - t1)) * p1[1] + ((t - t1) / (t2 - t1)) * p2[1];
    const a3L = ((t3 - t) / (t3 - t2)) * p2[0] + ((t - t2) / (t3 - t2)) * p3[0];
    const a3N = ((t3 - t) / (t3 - t2)) * p2[1] + ((t - t2) / (t3 - t2)) * p3[1];
    const b1L = ((t2 - t) / (t2 - t0)) * a1L + ((t - t0) / (t2 - t0)) * a2L;
    const b1N = ((t2 - t) / (t2 - t0)) * a1N + ((t - t0) / (t2 - t0)) * a2N;
    const b2L = ((t3 - t) / (t3 - t1)) * a2L + ((t - t1) / (t3 - t1)) * a3L;
    const b2N = ((t3 - t) / (t3 - t1)) * a2N + ((t - t1) / (t3 - t1)) * a3N;
    const cL = ((t2 - t) / (t2 - t1)) * b1L + ((t - t1) / (t2 - t1)) * b2L;
    const cN = ((t2 - t) / (t2 - t1)) * b1N + ((t - t1) / (t2 - t1)) * b2N;
    pts.push([cL, cN]);
  }
  return pts;
}

export function buildSegmentPaths(stops: StoryStop[]): [number, number][][] {
  const n = stops.length;
  if (n < 2) return [];

  const segments: [number, number][][] = [];

  for (let i = 0; i < n - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const type = to.pathType ?? "walk";

    if (type === "flight") {
      segments.push(greatCircleArc(from.coordinates, to.coordinates, SEG_PTS));
      continue;
    }

    const p1 = from.coordinates;
    const p2 = to.coordinates;

    let p0: [number, number];
    if (i > 0 && (stops[i].pathType ?? "walk") !== "flight") {
      p0 = stops[i - 1].coordinates;
    } else {
      p0 = [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
    }

    let p3: [number, number];
    if (i + 2 < n && (stops[i + 2].pathType ?? "walk") !== "flight") {
      p3 = stops[i + 2].coordinates;
    } else {
      p3 = [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    }

    segments.push(catmullRomSegment(p0, p1, p2, p3, SEG_PTS));
  }

  return segments;
}

export function unwrapSegPaths(
  segPaths: [number, number][][]
): [number, number][][] {
  if (segPaths.length === 0) return segPaths;
  let prevLng = segPaths[0][0]?.[1] ?? 0;
  return segPaths.map((seg) =>
    seg.map(([lat, lng]) => {
      while (lng - prevLng > 180) lng -= 360;
      while (lng - prevLng < -180) lng += 360;
      prevLng = lng;
      return [lat, lng] as [number, number];
    })
  );
}

// ── Cumulative path helpers ──────────────────────────────────

export function fullGuidePath(
  segPaths: [number, number][][]
): [number, number][] {
  const pts: [number, number][] = [];
  segPaths.forEach((seg, i) => {
    for (let j = i === 0 ? 0 : 1; j < seg.length; j++) pts.push(seg[j]);
  });
  return pts;
}

export type CumulativePath = {
  points: [number, number][];
  segStarts: number[];
};

export function buildCumulativePath(segPaths: [number, number][][]): CumulativePath {
  const points: [number, number][] = [];
  const segStarts: number[] = [];
  for (let i = 0; i < segPaths.length; i++) {
    segStarts.push(points.length);
    const seg = segPaths[i];
    for (let j = i === 0 ? 0 : 1; j < seg.length; j++) points.push(seg[j]);
  }
  return { points, segStarts };
}

export function pathEndIndex(
  cumPath: CumulativePath,
  segPaths: [number, number][][],
  stops: StoryStop[],
  progress: number
): { endIndex: number; tip: [number, number] | null } {
  if (stops.length === 0) return { endIndex: 0, tip: null };
  if (progress <= 0) return { endIndex: 0, tip: stops[0].coordinates };
  if (progress >= 1) return { endIndex: cumPath.points.length, tip: null };

  const total = stops.length - 1;
  const raw = Math.min(progress * total, total);
  const segIdx = Math.floor(raw);
  const segT = easeInOutCubic(raw - segIdx);

  let endIndex = segIdx < segPaths.length
    ? cumPath.segStarts[segIdx]
    : cumPath.points.length;

  if (segIdx < total && segIdx < segPaths.length) {
    const seg = segPaths[segIdx];
    const segStart = cumPath.segStarts[segIdx];
    const offset = segIdx === 0 ? 0 : 1;
    const exactPos = segT * (seg.length - 1);
    const pi = Math.floor(exactPos);
    const pt = exactPos - pi;
    endIndex = segStart + Math.max(0, pi + 1 - offset);

    if (pt > 0.001 && pi < seg.length - 1) {
      return {
        endIndex,
        tip: [
          lerp(seg[pi][0], seg[pi + 1][0], pt),
          lerp(seg[pi][1], seg[pi + 1][1], pt),
        ],
      };
    }
  } else {
    endIndex = cumPath.points.length;
  }

  return { endIndex, tip: null };
}

// ── Map progress remapping (dwell) ───────────────────────────

export function remapProgressForMap(
  rawP: number,
  stops: StoryStop[]
): number {
  const n = stops.length;
  if (n < 2 || rawP <= 0) return 0;
  if (rawP >= 1) return 1;

  const segments = n - 1;
  const raw = rawP * segments;
  const segIdx = Math.min(Math.floor(raw), segments - 1);
  const segT = raw - segIdx;

  const imgCount = stops[segIdx].images?.length ?? 0;

  let dwellFraction: number;
  if (imgCount > 1) {
    dwellFraction = (imgCount + 1) / (imgCount + 2);
  } else {
    dwellFraction = 0.15;
  }

  const nextStop = stops[Math.min(segIdx + 1, n - 1)];
  const dist = haversineKm(stops[segIdx].coordinates, nextStop.coordinates);
  if (dist > 500) {
    const boost = Math.min(0.15, dist / 20000);
    dwellFraction = Math.min(0.92, dwellFraction + boost);
  }

  let mapT: number;
  if (segT <= dwellFraction) {
    mapT = 0;
  } else {
    mapT = (segT - dwellFraction) / (1 - dwellFraction);
  }

  return (segIdx + mapT) / segments;
}

// ── Interpolation on pre-computed paths ──────────────────────

export function interpolateCoordsOnPath(
  segPaths: [number, number][][],
  stops: StoryStop[],
  progress: number
): [number, number] {
  if (stops.length === 0) return [0, 0];
  if (progress <= 0) return stops[0].coordinates;
  if (progress >= 1) return stops[stops.length - 1].coordinates;

  const total = stops.length - 1;
  const raw = progress * total;
  const idx = Math.floor(raw);
  const t = easeInOutCubic(raw - idx);

  const seg = segPaths[idx];
  if (!seg) return stops[stops.length - 1].coordinates;
  const pos = t * (seg.length - 1);
  const si = Math.floor(pos);
  const st = pos - si;
  if (si >= seg.length - 1) return seg[seg.length - 1];
  return [
    lerp(seg[si][0], seg[si + 1][0], st),
    lerp(seg[si][1], seg[si + 1][1], st),
  ];
}

export function interpolateZoomSmooth(
  stops: StoryStop[],
  progress: number
): number {
  if (stops.length === 0) return 5;
  if (progress <= 0) return stops[0].zoom ?? 5;
  if (progress >= 1) return stops[stops.length - 1].zoom ?? 12;

  const total = stops.length - 1;
  const raw = progress * total;
  const idx = Math.floor(raw);
  const t = raw - idx;

  const fromZ = stops[idx].zoom ?? 12;
  const toZ = stops[Math.min(idx + 1, stops.length - 1)].zoom ?? 12;
  const dist = haversineKm(
    stops[idx].coordinates,
    stops[Math.min(idx + 1, stops.length - 1)].coordinates
  );

  if (dist < 5) return lerp(fromZ, toZ, t);

  const overviewZ = Math.max(1, 17 - Math.log2(Math.max(1, dist)));

  if (dist > 3000) {
    const lowZ = Math.max(3, Math.min(fromZ, overviewZ));
    const dwellOut = 0.15;
    const dwellIn = 0.25;
    if (t <= dwellOut) return fromZ;
    if (t >= 1 - dwellIn) return toZ;
    const u = (t - dwellOut) / (1 - dwellOut - dwellIn);
    const k = 40;
    const sig = (x: number) => 1 / (1 + Math.exp(-k * (x - 0.5)));
    const s0 = sig(0);
    const s1 = sig(1);
    const s = (sig(u) - s0) / (s1 - s0);
    if (u < 0.5) {
      return lerp(fromZ, lowZ, s * 2);
    } else {
      return lerp(lowZ, toZ, (s - 0.5) * 2);
    }
  }

  const lowZ = Math.min(fromZ, toZ, overviewZ);
  if (t < 0.5) {
    const u = t / 0.5;
    return lerp(fromZ, lowZ, easeInOutCubic(u));
  } else {
    const u = (t - 0.5) / 0.5;
    return lerp(lowZ, toZ, easeInOutCubic(u));
  }
}
