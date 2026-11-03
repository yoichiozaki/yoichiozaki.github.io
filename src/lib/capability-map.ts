/**
 * The "levers of AI capability" map: element index, layout and relations.
 * Content lives in capability-map-{chain,upstream,downstream,measures,links}.ts
 * (the chain from capital to FCF in chain; the context layer in downstream,
 * next to the harness), sources in capability-map-sources.ts and article
 * quotes in capability-map-sections.ts.
 */
import { CAPITAL, CHAIN_LINK, FCF, GROSS_PROFIT, OPERATING_PROFIT, REVENUE } from "./capability-map-chain";
import { CONTEXT, HARNESS, MODEL, SYSTEM, USES } from "./capability-map-downstream";
import { COMPANIES, EDGES, KEY_POINTS, LOOPS } from "./capability-map-links";
import { MATERIALS, MEASURES } from "./capability-map-measures";
import { SECTIONS } from "./capability-map-sections";
import {
  isSub,
  type Category,
  type Detail,
  type GroupDef,
  type Locale,
  type NodeDef,
  type Side,
  type Text,
} from "./capability-map-types";
import { COMPUTE, RESOURCES, SIZE, STAGES } from "./capability-map-upstream";

export * from "./capability-map-types";
export { SOURCES } from "./capability-map-sources";
export { CHAIN_LINK, COMPANIES, EDGES, KEY_POINTS, LOOPS, SECTIONS };

export const GROUPS: GroupDef[] = [CAPITAL, RESOURCES, SIZE, STAGES, HARNESS, CONTEXT, MEASURES, USES, MATERIALS];
export const NODES: NodeDef[] = [REVENUE, GROSS_PROFIT, OPERATING_PROFIT, FCF, COMPUTE, MODEL, SYSTEM];
/** The money links along the top of the map, from the entrance of the chain to its end. */
export const MONEY_IDS: readonly string[] = [CAPITAL.id, REVENUE.id, GROSS_PROFIT.id, OPERATING_PROFIT.id, FCF.id];

export type ElementKind = "group" | "sub" | "item" | "node";
export type ElementInfo = {
  id: string;
  kind: ElementKind;
  category: Category;
  label: Text;
  sublabel?: Text;
  detail: Detail;
  parent?: string;
  children: string[];
  emphasis?: boolean;
};

function buildIndex(): Map<string, ElementInfo> {
  const map = new Map<string, ElementInfo>();
  const add = (info: ElementInfo) => {
    if (map.has(info.id)) throw new Error(`Duplicate element id: ${info.id}`);
    map.set(info.id, info);
  };
  for (const g of GROUPS) {
    add({ id: g.id, kind: "group", category: g.category, label: g.label, detail: g.detail, children: g.children.map((c) => c.id) });
    for (const c of g.children) {
      if (isSub(c)) {
        add({
          id: c.id,
          kind: "sub",
          category: g.category,
          label: c.label,
          detail: c.detail,
          parent: g.id,
          children: c.items.map((i) => i.id),
        });
        for (const i of c.items) {
          add({ id: i.id, kind: "item", category: g.category, label: i.label, detail: i.detail, parent: c.id, children: [] });
        }
      } else {
        add({ id: c.id, kind: "item", category: g.category, label: c.label, detail: c.detail, parent: g.id, children: [] });
      }
    }
  }
  for (const n of NODES) {
    add({
      id: n.id,
      kind: "node",
      category: n.category,
      label: n.label,
      sublabel: n.sublabel,
      detail: n.detail,
      children: [],
      emphasis: n.emphasis,
    });
  }
  return map;
}

export const ELEMENTS: ReadonlyMap<string, ElementInfo> = buildIndex();
export const EDGE_BY_ID = new Map(EDGES.map((e) => [e.id, e]));
export const LOOP_BY_ID = new Map(LOOPS.map((l) => [l.id, l]));
export const COMPANY_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));
export const KEY_POINT_BY_ID = new Map(KEY_POINTS.map((k) => [k.id, k]));

export const SUB_IDS: readonly string[] = [...ELEMENTS.values()].filter((e) => e.kind === "sub").map((e) => e.id);
export const DEFAULT_COLLAPSED: readonly string[] = ["measure-economy", "measure-cost", "measure-safety"];

export function ancestors(id: string): string[] {
  const out: string[] = [];
  for (let p = ELEMENTS.get(id)?.parent; p; p = ELEMENTS.get(p)?.parent) out.push(p);
  return out;
}

export function descendants(id: string): string[] {
  const out: string[] = [];
  const walk = (eid: string) => {
    for (const c of ELEMENTS.get(eid)?.children ?? []) {
      out.push(c);
      walk(c);
    }
  };
  walk(id);
  return out;
}

export type IdKind = "element" | "edge" | "loop" | "company" | "keypoint";

export function kindOf(id: string): IdKind | undefined {
  if (ELEMENTS.has(id)) return "element";
  if (EDGE_BY_ID.has(id)) return "edge";
  if (LOOP_BY_ID.has(id)) return "loop";
  if (COMPANY_BY_ID.has(id)) return "company";
  if (KEY_POINT_BY_ID.has(id)) return "keypoint";
  return undefined;
}

/** Label for anything that can be selected or shown in the detail dialog. */
export function labelOf(id: string): Text | undefined {
  return (
    ELEMENTS.get(id)?.label ??
    EDGE_BY_ID.get(id)?.label ??
    LOOP_BY_ID.get(id)?.label ??
    COMPANY_BY_ID.get(id)?.name ??
    KEY_POINT_BY_ID.get(id)?.title
  );
}

export function detailOf(id: string): Detail | undefined {
  return ELEMENTS.get(id)?.detail ?? EDGE_BY_ID.get(id)?.detail ?? LOOP_BY_ID.get(id)?.detail;
}

/** "4.6:tts" → { section: "4.6", point: "tts" }. */
export function parseRef(ref: string): { section: string; point?: string } {
  const [section, point] = ref.split(":");
  return { section, point };
}

/** "4.4" → 第 4.4 節 / Section 4.4; "2" → 第 2 章 / Chapter 2. */
export function refLabel(ref: string, locale: Locale): string {
  const { section } = parseRef(ref);
  const chapter = !section.includes(".");
  if (locale === "ja") return chapter ? `第 ${section} 章` : `第 ${section} 節`;
  return chapter ? `Chapter ${section}` : `Section ${section}`;
}

export type ResolvedRef = { ref: string; section: string; title: Text; quote: Text };

/** The section title and the quoted point a ref stands for (the section's first point by default). */
export function resolveRef(ref: string): ResolvedRef | undefined {
  const { section, point } = parseRef(ref);
  const def = SECTIONS[section];
  if (!def) return undefined;
  const quote = point ? def.points[point] : Object.values(def.points)[0];
  return quote ? { ref, section, title: def.title, quote } : undefined;
}

/**
 * Everything that should stay highlighted when `id` is selected: the element
 * itself with its ancestors (so its frames stay visible) and descendants, the
 * edges touching it, and the far ends of those edges. An edge also touches the
 * elements it is tied to, so a stage lights up the money arrow that deducts its
 * cost. Items without edges of their own borrow the edges of their nearest
 * ancestor that has some.
 */
export function relatedIds(id: string): Set<string> {
  const out = new Set<string>();
  const addElement = (eid: string) => {
    out.add(eid);
    for (const a of ancestors(eid)) out.add(a);
    for (const d of descendants(eid)) out.add(d);
  };
  const addAny = (anyId: string) => {
    const kind = kindOf(anyId);
    if (kind === "element") addElement(anyId);
    else if (kind === "edge" || kind === "loop") out.add(anyId);
  };
  const touches = (e: (typeof EDGES)[number], ids: ReadonlySet<string>) =>
    ids.has(e.from) || ids.has(e.to) || (e.ties ?? []).some((tie) => ids.has(tie));

  switch (kindOf(id)) {
    case "element": {
      addElement(id);
      const own = new Set([id, ...descendants(id)]);
      const lineage = new Set([id, ...ancestors(id), ...descendants(id)]);
      let touching = EDGES.filter((e) => touches(e, own));
      for (let p = ELEMENTS.get(id)?.parent; touching.length === 0 && p; p = ELEMENTS.get(p)?.parent) {
        const parent = new Set([p]);
        touching = EDGES.filter((e) => touches(e, parent));
      }
      for (const e of touching) {
        out.add(e.id);
        for (const end of [e.from, e.to]) {
          if (lineage.has(end)) out.add(end);
          else addElement(end);
        }
      }
      for (const l of LOOPS) if (l.cycle.some((c) => own.has(c))) out.add(l.id);
      break;
    }
    case "edge": {
      const e = EDGE_BY_ID.get(id)!;
      out.add(id);
      addElement(e.from);
      addElement(e.to);
      for (const tie of e.ties ?? []) addElement(tie);
      break;
    }
    case "loop": {
      out.add(id);
      for (const c of LOOP_BY_ID.get(id)!.cycle) addAny(c);
      break;
    }
    case "company":
      for (const f of COMPANY_BY_ID.get(id)!.focus) addAny(f);
      break;
    case "keypoint":
      for (const k of KEY_POINT_BY_ID.get(id)!.ids) addAny(k);
      break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = {
  /** The money links of the chain run along the top. */
  BAND_Y: 14,
  MONEY_H: 60,
  /** Lane for loops that cross the map above the capability layer, under the money band. */
  LANE_TOP: 96,
  /** Top of the capability layer in columns B–E; column A starts under the capital group. */
  TOP: 118,
  /** Room between the capital group and the resources it pays for. */
  CHAIN_GAP: 44,
  GROUP_HEADER: 32,
  PAD: 10,
  SUB_HEADER: 26,
  SUB_PAD: 6,
  ITEM_H: 26,
  ITEM_GAP: 4,
  SUB_GAP: 8,
  ROW_ITEM_H: 44,
  ROW_GAP: 8,
  NODE_H: 72,
  SYSTEM_H: 84,
  /** Loop lanes, measured from the right and bottom edges of the canvas. */
  LANE_OUTER: 22,
  LANE_INNER: 42,
  /** Room right of column E for the right-hand lanes and the price label between them and the uses. */
  RIGHT_MARGIN: 80,
} as const;

export const COLUMNS = {
  A: { x: 24, w: 200 },
  B: { x: 334, w: 176 },
  C: { x: 620, w: 226 },
  D: { x: 960, w: 204 },
  E: { x: 1254, w: 214 },
} as const;

export type Rect = { x: number; y: number; w: number; h: number };
export type BoxLayout = Rect & { id: string; kind: ElementKind; depth: number; collapsed?: boolean };
export type EdgeLayout = {
  id: string;
  kind: "flow" | "measure" | "money";
  path: string;
  labelX: number;
  labelY: number;
  /** Width available for the label pill without covering the boxes it joins. */
  labelMaxW: number;
};
export type LoopLayout = { id: string; path: string; labelX: number; labelY: number };
export type MapLayout = {
  width: number;
  height: number;
  boxes: Map<string, BoxLayout>;
  /** Box ids in paint order: groups, then subgroups, then items and nodes. */
  order: string[];
  edges: EdgeLayout[];
  loops: LoopLayout[];
};

const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const bottom = (r: Rect) => r.y + r.h;
const cx = (r: Rect) => r.x + r.w / 2;
const cy = (r: Rect) => r.y + r.h / 2;

function layoutGroup(g: GroupDef, x: number, y: number, w: number, collapsed: ReadonlySet<string>, boxes: Map<string, BoxLayout>): Rect {
  const L = LAYOUT;
  if (g.layout === "row") {
    const n = g.children.length;
    const cols = Math.min(n, g.columns ?? n);
    const rows = Math.ceil(n / cols);
    const iw = (w - 2 * L.PAD - (cols - 1) * L.ROW_GAP) / cols;
    g.children.forEach((c, i) => {
      boxes.set(c.id, {
        id: c.id,
        kind: "item",
        depth: 1,
        x: x + L.PAD + (i % cols) * (iw + L.ROW_GAP),
        y: y + L.GROUP_HEADER + Math.floor(i / cols) * (L.ROW_ITEM_H + L.ROW_GAP),
        w: iw,
        h: L.ROW_ITEM_H,
      });
    });
    const rect = { x, y, w, h: L.GROUP_HEADER + rows * L.ROW_ITEM_H + (rows - 1) * L.ROW_GAP + L.PAD };
    boxes.set(g.id, { ...rect, id: g.id, kind: "group", depth: 0 });
    return rect;
  }

  const innerX = x + L.PAD;
  const innerW = w - 2 * L.PAD;
  let cursor = y + L.GROUP_HEADER;
  g.children.forEach((c, i) => {
    if (i > 0) cursor += isSub(c) || isSub(g.children[i - 1]) ? L.SUB_GAP : L.ITEM_GAP;
    if (!isSub(c)) {
      boxes.set(c.id, { id: c.id, kind: "item", depth: 1, x: innerX, y: cursor, w: innerW, h: L.ITEM_H });
      cursor += L.ITEM_H;
      return;
    }
    const isCollapsed = collapsed.has(c.id);
    let h = L.SUB_HEADER;
    if (!isCollapsed) {
      c.items.forEach((it, j) => {
        boxes.set(it.id, {
          id: it.id,
          kind: "item",
          depth: 2,
          x: innerX + L.SUB_PAD,
          y: cursor + L.SUB_HEADER + j * (L.ITEM_H + L.ITEM_GAP),
          w: innerW - 2 * L.SUB_PAD,
          h: L.ITEM_H,
        });
      });
      h += c.items.length * L.ITEM_H + (c.items.length - 1) * L.ITEM_GAP + L.SUB_PAD;
    }
    boxes.set(c.id, { id: c.id, kind: "sub", depth: 1, x: innerX, y: cursor, w: innerW, h, collapsed: isCollapsed });
    cursor += h;
  });
  const rect = { x, y, w, h: cursor + L.PAD - y };
  boxes.set(g.id, { ...rect, id: g.id, kind: "group", depth: 0 });
  return rect;
}

/**
 * Anchor positions along one axis: if the two spans overlap, both ends share
 * one coordinate (the centre of the smaller span, kept inside the overlap) so
 * the line runs straight; otherwise each end points at the other's centre.
 * `lead1` and `lead2` keep an end further from the start of its span, clear of
 * a badge pinned to the box's top-left corner.
 */
function align(s1: number, l1: number, s2: number, l2: number, lead1 = 10, lead2 = 10, inset = 10): [number, number] {
  const lo = Math.max(s1 + lead1, s2 + lead2);
  const hi = Math.min(s1 + l1, s2 + l2) - inset;
  const c1 = s1 + l1 / 2;
  const c2 = s2 + l2 / 2;
  if (lo <= hi) {
    const v = clamp(l1 <= l2 ? c1 : c2, lo, hi);
    return [v, v];
  }
  return [clamp(c2, s1 + lead1, s1 + l1 - inset), clamp(c1, s2 + lead2, s2 + l2 - inset)];
}

/** Room an arrow end keeps from the top-left corner of a box that carries a chain badge. */
const BADGE_CLEAR = 24;

function edgeGeometry(a: BoxLayout, b: BoxLayout, fromSide: Side, toSide: Side) {
  const horizontal = fromSide === "left" || fromSide === "right";
  // A badge sits on the top-left corner, so only ends on a left side (near its top) or a top side (near its left) need room.
  const lead = (box: BoxLayout, side: Side) => (CHAIN_LINK[box.id] && side === (horizontal ? "left" : "top") ? BADGE_CLEAR : 10);
  if (horizontal) {
    const [y1, y2] = align(a.y, a.h, b.y, b.h, lead(a, fromSide), lead(b, toSide));
    return { x1: fromSide === "right" ? a.x + a.w : a.x, y1, x2: toSide === "left" ? b.x : b.x + b.w, y2, horizontal };
  }
  const [x1, x2] = align(a.x, a.w, b.x, b.w, lead(a, fromSide), lead(b, toSide));
  return { x1, y1: fromSide === "bottom" ? a.y + a.h : a.y, x2, y2: toSide === "top" ? b.y : b.y + b.h, horizontal };
}

function bezier(x1: number, y1: number, x2: number, y2: number, horizontal: boolean): string {
  if (horizontal) {
    const dx = Math.max(24, Math.abs(x2 - x1) / 2) * Math.sign(x2 - x1 || 1);
    return `M ${round(x1)} ${round(y1)} C ${round(x1 + dx)} ${round(y1)}, ${round(x2 - dx)} ${round(y2)}, ${round(x2)} ${round(y2)}`;
  }
  const dy = Math.max(24, Math.abs(y2 - y1) / 2) * Math.sign(y2 - y1 || 1);
  return `M ${round(x1)} ${round(y1)} C ${round(x1)} ${round(y1 + dy)}, ${round(x2)} ${round(y2 - dy)}, ${round(x2)} ${round(y2)}`;
}

/** A polyline with rounded corners. */
export function roundedPath(points: [number, number][], radius = 12): string {
  const [first, ...rest] = points;
  let d = `M ${round(first[0])} ${round(first[1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [qx, qy] = points[i];
    const [nx, ny] = points[i + 1];
    const d1 = Math.hypot(qx - px, qy - py);
    const d2 = Math.hypot(nx - qx, ny - qy);
    const r = Math.min(radius, d1 / 2, d2 / 2);
    if (r <= 0) continue;
    const ax = qx + ((px - qx) / d1) * r;
    const ay = qy + ((py - qy) / d1) * r;
    const bx = qx + ((nx - qx) / d2) * r;
    const by = qy + ((ny - qy) / d2) * r;
    d += ` L ${round(ax)} ${round(ay)} Q ${round(qx)} ${round(qy)} ${round(bx)} ${round(by)}`;
  }
  const last = rest[rest.length - 1] ?? first;
  return `${d} L ${round(last[0])} ${round(last[1])}`;
}

function loopPoints(id: string, boxes: Map<string, BoxLayout>, edges: EdgeLayout[], width: number, height: number) {
  const L = LAYOUT;
  const box = (bid: string) => {
    const b = boxes.get(bid);
    if (!b) throw new Error(`Loop ${id} needs box ${bid}`);
    return b;
  };
  const innerRight = width - L.LANE_INNER;
  const bottomLow = height - L.LANE_OUTER;
  const bottomHigh = height - L.LANE_INNER;

  switch (id) {
    case "loop-research": {
      const ai = box("ai-research");
      const target = edges.find((e) => e.id === "e-algorithmic");
      if (!target) throw new Error("loop-research needs e-algorithmic");
      // Crosses above the capability layer, below the money band.
      const points: [number, number][] = [
        [ai.x + ai.w, cy(ai)],
        [innerRight, cy(ai)],
        [innerRight, L.LANE_TOP],
        [target.labelX, L.LANE_TOP],
        [target.labelX, target.labelY - 12],
      ];
      return { points, labelX: (innerRight + target.labelX) / 2, labelY: L.LANE_TOP };
    }
    case "loop-deployment": {
      const uses = box("uses");
      const traces = box("deployment-traces");
      const materials = box("materials");
      const points: [number, number][] = [
        [cx(uses), bottom(uses)],
        [cx(uses), bottomLow],
        [cx(traces), bottomLow],
        [cx(traces), bottom(materials)],
      ];
      return { points, labelX: cx(traces) + 0.7 * (cx(uses) - cx(traces)), labelY: bottomLow };
    }
    case "loop-synthetic": {
      const system = box("system");
      const synthetic = box("synthetic");
      const materials = box("materials");
      const stages = box("stages");
      // Leaves the system's left side and runs down the gap before it, clear of the context layer underneath.
      const laneX = (stages.x + stages.w + system.x) / 2;
      const startY = bottom(system) - 18;
      const points: [number, number][] = [
        [system.x, startY],
        [laneX, startY],
        [laneX, bottomHigh],
        [cx(synthetic), bottomHigh],
        [cx(synthetic), bottom(materials)],
      ];
      return { points, labelX: (laneX + cx(synthetic)) / 2, labelY: bottomHigh };
    }
    default:
      throw new Error(`No layout for loop ${id}`);
  }
}

export function layoutMap(collapsed: ReadonlySet<string> = new Set(DEFAULT_COLLAPSED)): MapLayout {
  const L = LAYOUT;
  const C = COLUMNS;
  const boxes = new Map<string, BoxLayout>();
  const node = (n: NodeDef, col: { x: number; w: number }, y: number, h: number): Rect => {
    const rect = { x: col.x, y, w: col.w, h };
    boxes.set(n.id, { ...rect, id: n.id, kind: "node", depth: 0 });
    return rect;
  };

  // The money band: each link sits over the column whose cost is deducted on the way to it, so the chain
  // reads right to left along the top, from revenue (over the uses) back to capital (over the resources).
  const capital = layoutGroup(CAPITAL, C.A.x, L.BAND_Y, C.A.w, collapsed, boxes);
  node(FCF, C.B, L.BAND_Y, L.MONEY_H);
  node(OPERATING_PROFIT, C.C, L.BAND_Y, L.MONEY_H);
  node(GROSS_PROFIT, C.D, L.BAND_Y, L.MONEY_H);
  node(REVENUE, C.E, L.BAND_Y, L.MONEY_H);

  const resources = layoutGroup(RESOURCES, C.A.x, bottom(capital) + L.CHAIN_GAP, C.A.w, collapsed, boxes);
  node(COMPUTE, C.B, L.TOP + 86, L.NODE_H);
  const size = layoutGroup(SIZE, C.B.x, L.TOP + 262, C.B.w, collapsed, boxes);
  const stages = layoutGroup(STAGES, C.C.x, L.TOP, C.C.w, collapsed, boxes);
  const model = node(MODEL, C.D, L.TOP, L.NODE_H);
  const harness = layoutGroup(HARNESS, C.D.x, bottom(model) + 40, C.D.w, collapsed, boxes);
  const system = node(SYSTEM, C.D, bottom(harness) + 46, L.SYSTEM_H);
  // The context layer sits under the system it feeds, the way Microsoft draws its IQ layer under agents.
  const context = layoutGroup(CONTEXT, C.D.x, bottom(system) + 46, C.D.w, collapsed, boxes);
  const measures = layoutGroup(MEASURES, C.E.x, L.TOP, C.E.w, collapsed, boxes);
  const uses = layoutGroup(USES, C.E.x, Math.max(system.y, bottom(measures) + 44), C.E.w, collapsed, boxes);
  // Learning materials sit under model size and the stages they feed.
  const materialsY = Math.max(bottom(size), bottom(stages)) + 64;
  const materials = layoutGroup(MATERIALS, C.B.x, materialsY, C.C.x + C.C.w - C.B.x, collapsed, boxes);

  const width = C.E.x + C.E.w + L.RIGHT_MARGIN;
  const height = Math.max(bottom(materials), bottom(resources), bottom(context), bottom(uses)) + 72;
  const outerRight = width - L.LANE_OUTER;

  const edges: EdgeLayout[] = EDGES.map((e) => {
    const a = boxes.get(e.from);
    const b = boxes.get(e.drawTo ?? e.to);
    if (!a || !b) throw new Error(`Edge ${e.id} has no box to draw between`);
    if (e.lane === "right") {
      // Leaves low on the right of `a`, runs up the outer lane and comes back in to the right of `b`.
      const y1 = bottom(a) - 26;
      const y2 = cy(b);
      const points: [number, number][] = [
        [a.x + a.w, y1],
        [outerRight, y1],
        [outerRight, y2],
        [b.x + b.w, y2],
      ];
      return {
        id: e.id,
        kind: e.kind,
        path: roundedPath(points),
        labelX: round((a.x + a.w + outerRight) / 2),
        labelY: round(y1),
        labelMaxW: outerRight - (a.x + a.w) - 8,
      };
    }
    const g = edgeGeometry(a, b, e.fromSide, e.toSide);
    return {
      id: e.id,
      kind: e.kind,
      path: bezier(g.x1, g.y1, g.x2, g.y2, g.horizontal),
      labelX: round((g.x1 + g.x2) / 2),
      labelY: round((g.y1 + g.y2) / 2),
      labelMaxW: g.horizontal ? Math.max(40, Math.abs(g.x2 - g.x1) - 8) : 180,
    };
  });

  const loops: LoopLayout[] = LOOPS.map((l) => {
    const p = loopPoints(l.id, boxes, edges, width, height);
    return { id: l.id, path: roundedPath(p.points), labelX: round(p.labelX), labelY: round(p.labelY) };
  });

  const order = [...boxes.values()]
    .sort((p, q) => (p.kind === "group" ? 0 : p.kind === "sub" ? 1 : 2) - (q.kind === "group" ? 0 : q.kind === "sub" ? 1 : 2))
    .map((b) => b.id);

  return { width, height, boxes, order, edges, loops };
}
