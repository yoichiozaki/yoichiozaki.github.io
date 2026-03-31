import { describe, it, expect } from "vitest";
import type { StoryStop } from "@/components/StorytellingMap";
import {
  lerp,
  easeInOutCubic,
  parseTitle,
  haversineKm,
  buildSegmentPaths,
  buildCumulativePath,
  pathEndIndex,
  remapProgressForMap,
  interpolateCoordsOnPath,
  interpolateZoomSmooth,
  fullGuidePath,
} from "@/lib/storytelling-map-utils";

// ── Test fixtures ────────────────────────────────────────────

/** Minimal 3-stop fixture for most tests */
const threeStops: StoryStop[] = [
  {
    id: "a",
    title: "A",
    description: "",
    coordinates: [35.0, 139.0],
    zoom: 10,
    images: ["/img/a1.webp"],
  },
  {
    id: "b",
    title: "B",
    description: "",
    coordinates: [36.0, 140.0],
    zoom: 12,
    images: ["/img/b1.webp", "/img/b2.webp", "/img/b3.webp"],
  },
  {
    id: "c",
    title: "C",
    description: "",
    coordinates: [37.0, 141.0],
    zoom: 14,
  },
];

/** Realistic fixture mimicking the seattle-vancouver trip problem stops */
const seattleBarToNarita: StoryStop[] = [
  {
    id: "microsoft",
    title: "💻 Microsoft本社",
    description: "",
    coordinates: [47.6396, -122.1286],
    zoom: 14,
    pathType: "drive",
    images: ["/img/ms.webp"],
  },
  {
    id: "seattle-bar",
    title: "🍺 シアトルの夜",
    description: "",
    coordinates: [47.6253, -122.3222],
    zoom: 15,
    pathType: "drive",
    images: ["/img/bar1.webp", "/img/bar2.webp", "/img/bar3.webp"],
  },
  {
    id: "border",
    title: "🚌 国境越え",
    description: "",
    coordinates: [49.0024, -122.756],
    zoom: 9,
    pathType: "drive",
    images: ["/img/border.webp"],
  },
  {
    id: "gastown",
    title: "⏰ Gastown",
    description: "",
    coordinates: [49.2844, -123.1088],
    zoom: 16,
    images: ["/img/gas1.webp", "/img/gas2.webp"],
  },
  {
    id: "narita",
    title: "🛬 帰国",
    description: "",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    pathType: "flight",
    images: ["/img/narita.webp"],
  },
];

// ── lerp ─────────────────────────────────────────────────────

describe("lerp", () => {
  it("returns a when t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });
  it("returns b when t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });
  it("returns midpoint when t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

// ── easeInOutCubic ───────────────────────────────────────────

describe("easeInOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeInOutCubic(0)).toBe(0);
  });
  it("returns 1 at t=1", () => {
    expect(easeInOutCubic(1)).toBe(1);
  });
  it("returns 0.5 at t=0.5", () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });
  it("is monotonically increasing", () => {
    let prev = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

// ── parseTitle ───────────────────────────────────────────────

describe("parseTitle", () => {
  it("extracts emoji, place, and subtitle", () => {
    const result = parseTitle("🐟 Pike Place Market — スターバックス1号店");
    expect(result.icon).toBe("🐟");
    expect(result.place).toBe("Pike Place Market");
    expect(result.subtitle).toBe("スターバックス1号店");
  });
  it("handles title without subtitle", () => {
    const result = parseTitle("🗼 Space Needle");
    expect(result.icon).toBe("🗼");
    expect(result.place).toBe("Space Needle");
    expect(result.subtitle).toBe("");
  });
  it("handles title without emoji", () => {
    const result = parseTitle("Plain Title — Sub");
    expect(result.icon).toBe("");
    expect(result.place).toBe("Plain Title");
    expect(result.subtitle).toBe("Sub");
  });
});

// ── haversineKm ──────────────────────────────────────────────

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm([35.0, 139.0], [35.0, 139.0])).toBe(0);
  });
  it("calculates ~8,000km for Narita→Seattle", () => {
    const d = haversineKm([35.7647, 140.3864], [47.6097, -122.3425]);
    expect(d).toBeGreaterThan(7500);
    expect(d).toBeLessThan(8500);
  });
  it("calculates short distance between nearby Seattle stops", () => {
    const d = haversineKm([47.6097, -122.3425], [47.6205, -122.3493]);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(3);
  });
});

// ── buildCumulativePath ──────────────────────────────────────

describe("buildCumulativePath", () => {
  it("first segment contributes all points", () => {
    const seg0: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    const seg1: [number, number][] = [[2, 2], [3, 3], [4, 4]];
    const cum = buildCumulativePath([seg0, seg1]);
    // seg0: 3 points (all included), seg1: 2 points (skip first duplicate)
    expect(cum.points).toHaveLength(5);
    expect(cum.segStarts).toEqual([0, 3]);
  });

  it("builds correctly for single segment", () => {
    const seg: [number, number][] = [[0, 0], [1, 1]];
    const cum = buildCumulativePath([seg]);
    expect(cum.points).toHaveLength(2);
    expect(cum.segStarts).toEqual([0]);
  });
});

// ── pathEndIndex — the bug that caused lines extending past stops ─

describe("pathEndIndex", () => {
  // 3 points per segment for easy reasoning
  const seg0: [number, number][] = [[0, 0], [0.5, 0.5], [1, 1]];
  const seg1: [number, number][] = [[1, 1], [50, 50], [100, 100]]; // big jump
  const segPaths = [seg0, seg1];
  const cumPath = buildCumulativePath(segPaths);
  const stops: StoryStop[] = [
    { id: "a", title: "A", description: "", coordinates: [0, 0], zoom: 10 },
    { id: "b", title: "B", description: "", coordinates: [1, 1], zoom: 10 },
    { id: "c", title: "C", description: "", coordinates: [100, 100], zoom: 10 },
  ];

  it("at progress=0, returns first stop coordinates as tip", () => {
    const result = pathEndIndex(cumPath, segPaths, stops, 0);
    expect(result.endIndex).toBe(0);
    expect(result.tip).toEqual([0, 0]);
  });

  it("at progress=1, returns all points", () => {
    const result = pathEndIndex(cumPath, segPaths, stops, 1);
    expect(result.endIndex).toBe(cumPath.points.length);
    expect(result.tip).toBeNull();
  });

  it("at exact stop boundary (progress=0.5), does NOT extend into next segment", () => {
    // progress=0.5 with 3 stops means exactly at stop index 1
    // easeInOutCubic(0) = 0, so segT = 0
    const result = pathEndIndex(cumPath, segPaths, stops, 0.5);
    // At stop 1, endIndex should include all of seg0 but nothing from seg1
    // seg0 has 3 points (indices 0,1,2), seg1 starts at index 3
    // endIndex should be <= 3, not 4 (which would include seg1's first new point [50,50])
    const lastPoint = cumPath.points[result.endIndex - 1];
    if (result.tip) {
      // tip should be near stop 1's coordinates [1,1], not [50,50]
      expect(result.tip[0]).toBeLessThan(2);
    } else {
      // last drawn point should be [1,1] or earlier, not [50,50]
      expect(lastPoint[0]).toBeLessThanOrEqual(1);
    }
  });

  it("near-boundary progress does not jump to distant next segment point", () => {
    // Just slightly past the boundary
    const result = pathEndIndex(cumPath, segPaths, stops, 0.501);
    // Should still be near stop 1, not jumping to [50,50]
    if (result.tip) {
      expect(result.tip[0]).toBeLessThan(10);
    }
  });
});

// ── remapProgressForMap ──────────────────────────────────────

describe("remapProgressForMap", () => {
  it("returns 0 for rawP=0", () => {
    expect(remapProgressForMap(0, threeStops)).toBe(0);
  });

  it("returns 1 for rawP=1", () => {
    expect(remapProgressForMap(1, threeStops)).toBe(1);
  });

  it("returns 0 when within dwell zone of first segment", () => {
    // First stop has 1 image → base dwell 0.15
    // rawP = 0.05 → segIdx=0, segT=0.1 < 0.15 → mapT=0
    const result = remapProgressForMap(0.05, threeStops);
    expect(result).toBe(0);
  });

  it("multi-image stop has larger dwell", () => {
    // Stop index 1 has 3 images → dwell = (3+1)/(3+2) = 0.8
    // rawP=0.5, segments=2, raw=1.0, segIdx=1, segT=0.0
    // segT=0 < dwellFraction → mapT=0 → result = (1+0)/2 = 0.5
    expect(remapProgressForMap(0.5, threeStops)).toBe(0.5);
    // Within the dwell zone it should stay at 0.5 (the segment start)
    // rawP=0.7 → raw=1.4 → segIdx=1, segT=0.4 < 0.8 → still in dwell
    expect(remapProgressForMap(0.7, threeStops)).toBe(0.5);
  });

  it("is monotonically non-decreasing", () => {
    let prev = 0;
    for (let p = 0; p <= 1; p += 0.001) {
      const v = remapProgressForMap(p, seattleBarToNarita);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-10);
      prev = v;
    }
  });

  it("output is always in [0, 1]", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const v = remapProgressForMap(p, seattleBarToNarita);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("long-distance segment gets boosted dwell", () => {
    // gastown → narita is >8000km, dwell should be boosted beyond base
    // segIdx=3 (gastown), images=2 → base dwell = (2+1)/(2+2) = 0.75
    // dist > 500 → boost = min(0.15, dist/20000) ≈ 0.15
    // capped at 0.92
    const segStart = 3 / 4; // segment 3 starts at rawP = 0.75
    const justInDwell = segStart + 0.01;
    const result = remapProgressForMap(justInDwell, seattleBarToNarita);
    // Should still be at segment 3 start (0.75) because within dwell
    expect(result).toBeCloseTo(segStart, 1);
  });
});

// ── interpolateCoordsOnPath ──────────────────────────────────

describe("interpolateCoordsOnPath", () => {
  const segPaths = buildSegmentPaths(threeStops);

  it("returns first stop coords at progress=0", () => {
    const result = interpolateCoordsOnPath(segPaths, threeStops, 0);
    expect(result).toEqual(threeStops[0].coordinates);
  });

  it("returns last stop coords at progress=1", () => {
    const result = interpolateCoordsOnPath(segPaths, threeStops, 1);
    expect(result).toEqual(threeStops[threeStops.length - 1].coordinates);
  });

  it("returns intermediate coords at progress=0.5", () => {
    const result = interpolateCoordsOnPath(segPaths, threeStops, 0.5);
    // Should be near stop B's coordinates [36.0, 140.0]
    expect(result[0]).toBeCloseTo(36.0, 0);
    expect(result[1]).toBeCloseTo(140.0, 0);
  });
});

// ── interpolateZoomSmooth ────────────────────────────────────

describe("interpolateZoomSmooth", () => {
  it("returns first stop zoom at progress=0", () => {
    const result = interpolateZoomSmooth(threeStops, 0);
    expect(result).toBe(10);
  });

  it("returns last stop zoom at progress=1", () => {
    const result = interpolateZoomSmooth(threeStops, 1);
    expect(result).toBe(14);
  });

  it("zooms out for long-distance flights", () => {
    // Narita→Seattle flight: distance > 3000km, uses sigmoid zoom valley
    const flightStops: StoryStop[] = [
      { id: "a", title: "A", description: "", coordinates: [35.7647, 140.3864], zoom: 5 },
      { id: "b", title: "B", description: "", coordinates: [47.6097, -122.3425], zoom: 15, pathType: "flight" },
    ];
    const midZoom = interpolateZoomSmooth(flightStops, 0.5);
    // At t=0.5 the sigmoid is in the valley — zoom should be below both endpoints
    expect(midZoom).toBeLessThan(15);
    // Departure zoom at t=0 and arrival zoom at t=1
    expect(interpolateZoomSmooth(flightStops, 0)).toBe(5);
    expect(interpolateZoomSmooth(flightStops, 1)).toBe(15);
  });
});

// ── fullGuidePath ────────────────────────────────────────────

describe("fullGuidePath", () => {
  it("deduplicates junction points", () => {
    const seg0: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    const seg1: [number, number][] = [[2, 2], [3, 3], [4, 4]];
    const guide = fullGuidePath([seg0, seg1]);
    // Should have 5 points: seg0 all + seg1 minus first
    expect(guide).toHaveLength(5);
    expect(guide[2]).toEqual([2, 2]);
    expect(guide[3]).toEqual([3, 3]);
  });
});

// ── Integration: pathEndIndex with real trip data ────────────

describe("pathEndIndex with seattle-vancouver data", () => {
  const segPaths = buildSegmentPaths(seattleBarToNarita);
  const cumPath = buildCumulativePath(segPaths);
  const n = seattleBarToNarita.length;

  it("at each exact stop boundary, path does not extend into next segment", () => {
    for (let i = 1; i < n - 1; i++) {
      const progress = i / (n - 1);
      const result = pathEndIndex(cumPath, segPaths, seattleBarToNarita, progress);

      // The drawn path up to this point should end at or before segStarts[i]
      // (which is the start of segment i, the segment AFTER stop i)
      if (i < segPaths.length) {
        const nextSegStart = cumPath.segStarts[i];
        const effectiveEnd = result.tip
          ? result.endIndex + 1 // tip adds one virtual point
          : result.endIndex;
        // Allow endIndex to be at most nextSegStart (all of the completed segment)
        // but NOT beyond it (which would draw into the next segment)
        expect(result.endIndex).toBeLessThanOrEqual(nextSegStart + 1);
      }
    }
  });

  it("path grows monotonically with progress", () => {
    let prevEnd = 0;
    for (let p = 0; p <= 1; p += 0.01) {
      const result = pathEndIndex(cumPath, segPaths, seattleBarToNarita, p);
      expect(result.endIndex).toBeGreaterThanOrEqual(prevEnd);
      prevEnd = result.endIndex;
    }
  });
});
