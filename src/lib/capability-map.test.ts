import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPANIES,
  DEFAULT_COLLAPSED,
  EDGES,
  ELEMENTS,
  KEY_POINTS,
  LAYOUT,
  LOOPS,
  SUB_IDS,
  ancestors,
  descendants,
  detailOf,
  kindOf,
  labelOf,
  layoutMap,
  refLabel,
  relatedIds,
  type Detail,
  type MapLayout,
  type Rect,
  type Text,
} from "./capability-map";

const root = resolve(__dirname, "..", "..");
const slug = "ai-industry-capital-to-fcf";
const sources = Object.fromEntries(
  (["ja", "en"] as const).map((locale) => [locale, readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8")]),
) as Record<"ja" | "en", string>;

const allIds = [
  ...ELEMENTS.keys(),
  ...EDGES.map((e) => e.id),
  ...LOOPS.map((l) => l.id),
  ...COMPANIES.map((c) => c.id),
  ...KEY_POINTS.map((k) => k.id),
];

const details: [string, Detail][] = [
  ...[...ELEMENTS.values()].map((e) => [e.id, e.detail] as [string, Detail]),
  ...EDGES.filter((e) => e.detail).map((e) => [e.id, e.detail!] as [string, Detail]),
  ...LOOPS.map((l) => [l.id, l.detail] as [string, Detail]),
];

function texts(): [string, Text][] {
  const out: [string, Text][] = [];
  for (const e of ELEMENTS.values()) {
    out.push([`${e.id}.label`, e.label]);
    if (e.sublabel) out.push([`${e.id}.sublabel`, e.sublabel]);
  }
  for (const [id, d] of details) {
    out.push([`${id}.summary`, d.summary]);
    if (d.note) out.push([`${id}.note`, d.note]);
    for (const l of d.links ?? []) out.push([`${id}.link`, l]);
  }
  for (const e of EDGES) if (e.label) out.push([`${e.id}.label`, e.label]);
  for (const l of LOOPS) out.push([`${l.id}.label`, l.label]);
  for (const c of COMPANIES) {
    out.push([`${c.id}.name`, c.name]);
    c.points.forEach((p, i) => out.push([`${c.id}.point${i}`, p]));
  }
  for (const k of KEY_POINTS) out.push([`${k.id}.title`, k.title], [`${k.id}.body`, k.body]);
  return out;
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

const states: [string, Set<string>][] = [
  ["default", new Set(DEFAULT_COLLAPSED)],
  ["all collapsed", new Set(SUB_IDS)],
  ["all expanded", new Set()],
];

describe("capability map: data", () => {
  it("uses unique ids across elements, edges, loops, companies and key points", () => {
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("only refers to ids that exist", () => {
    for (const e of EDGES) {
      expect(ELEMENTS.has(e.from), e.id).toBe(true);
      expect(ELEMENTS.has(e.to), e.id).toBe(true);
      if (e.drawTo) expect(ancestors(e.to), e.id).toContain(e.drawTo);
    }
    const referable = (id: string) => ["element", "edge", "loop"].includes(kindOf(id) ?? "");
    for (const l of LOOPS) for (const id of l.cycle) expect(referable(id), `${l.id} → ${id}`).toBe(true);
    for (const c of COMPANIES) for (const id of c.focus) expect(referable(id), `${c.id} → ${id}`).toBe(true);
    for (const k of KEY_POINTS) for (const id of k.ids) expect(referable(id), `${k.id} → ${id}`).toBe(true);
    for (const id of DEFAULT_COLLAPSED) expect(SUB_IDS).toContain(id);
  });

  it("has every text in both languages, without Markdown or stray dollar signs", () => {
    for (const [where, text] of texts()) {
      expect(text.ja.trim(), where).not.toBe("");
      expect(text.en.trim(), where).not.toBe("");
      for (const s of [text.ja, text.en]) {
        expect(s, where).not.toMatch(/\*\*|\$/);
      }
    }
  });

  it("labels every efficiency arrow and every measurement arrow", () => {
    const unlabelled = EDGES.filter((e) => !e.label).map((e) => e.id);
    expect(unlabelled.sort()).toEqual(["e-model-harness", "e-system-uses"]);
    for (const e of EDGES.filter((x) => x.label && x.kind === "flow")) expect(e.detail, e.id).toBeDefined();
  });

  it("gives everything selectable a label and every element a detail", () => {
    const unlabelledEdges = new Set(EDGES.filter((e) => !e.label).map((e) => e.id));
    for (const id of allIds.filter((x) => !unlabelledEdges.has(x))) expect(labelOf(id), id).toBeDefined();
    for (const id of ELEMENTS.keys()) expect(detailOf(id), id).toBeDefined();
  });

  it("keeps model capability, the harness and getting work done apart", () => {
    expect(ELEMENTS.get("model")?.kind).toBe("node");
    expect(ELEMENTS.get("system")?.kind).toBe("node");
    expect(ELEMENTS.get("harness")?.kind).toBe("group");
    expect(EDGES.find((e) => e.id === "e-model-harness")).toMatchObject({ from: "model", to: "harness" });
    expect(EDGES.find((e) => e.id === "e-harness")).toMatchObject({ from: "harness", to: "system" });
    expect(EDGES.find((e) => e.id === "e-inference")).toMatchObject({ from: "inference", to: "harness" });
    expect(EDGES.find((e) => e.id === "e-algorithmic")).toMatchObject({ from: "training", to: "model" });
    expect(EDGES.find((e) => e.id === "e-system-uses")).toMatchObject({ from: "system", to: "uses" });
  });

  it("measures the model alone and getting work done separately", () => {
    expect(ELEMENTS.get("measure-model")?.children).toEqual(["loss", "benchmarks"]);
    expect(ELEMENTS.get("measure-system")?.children).toEqual(["metr", "gdpval", "rli", "arc-agi-3"]);
    // ECI blends both kinds of measure, so it sits outside either group.
    expect(ELEMENTS.get("eci")?.parent).toBe("measures");
    expect(EDGES.find((e) => e.id === "m-model")).toMatchObject({ from: "model", to: "measure-model" });
    expect(EDGES.find((e) => e.id === "m-system")).toMatchObject({ from: "system", to: "measure-system" });
  });

  it.each(["ja", "en"] as const)("only cites sections that exist in the article (%s)", (locale) => {
    const headings = new Set(
      [...sources[locale].matchAll(/^#{2,3} (\d+(?:\.\d+)?)\.?\s/gm)].map((m) => m[1]),
    );
    for (const [id, d] of details) for (const ref of d.refs ?? []) expect(headings.has(ref), `${id} → ${ref}`).toBe(true);
  });

  it("links only to posts that exist in both languages", () => {
    for (const [id, d] of details) {
      for (const l of d.links ?? []) {
        expect(Boolean(l.href) !== Boolean(l.slug), id).toBe(true);
        if (l.href) expect(l.href, id).toMatch(/^https:\/\//);
        if (l.slug) {
          for (const locale of ["ja", "en"]) {
            expect(existsSync(resolve(root, "content", "blog", locale, `${l.slug}.mdx`)), `${id} → ${locale}/${l.slug}`).toBe(true);
          }
        }
      }
    }
  });

  it("formats section references", () => {
    expect(refLabel("4.4", "ja")).toBe("第 4.4 節");
    expect(refLabel("2", "ja")).toBe("第 2 章");
    expect(refLabel("4.4", "en")).toBe("Section 4.4");
    expect(refLabel("2", "en")).toBe("Chapter 2");
  });
});

describe("capability map: layout", () => {
  const top = (layout: MapLayout) => [...layout.boxes.values()].filter((b) => b.depth === 0);

  it.each(states)("does not overlap top-level boxes (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    const boxes = top(layout);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlaps(boxes[i], boxes[j]), `${boxes[i].id} × ${boxes[j].id}`).toBe(false);
      }
    }
  });

  it.each(states)("keeps children inside parents and everything on the canvas (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    const canvas = { x: 0, y: 0, w: layout.width, h: layout.height };
    for (const b of layout.boxes.values()) {
      expect(inside(b, canvas), b.id).toBe(true);
      const parent = ELEMENTS.get(b.id)?.parent;
      if (parent) expect(inside(b, layout.boxes.get(parent)!), `${b.id} in ${parent}`).toBe(true);
    }
  });

  it.each(states)("keeps siblings apart (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    for (const e of ELEMENTS.values()) {
      const kids = e.children.map((c) => layout.boxes.get(c)).filter((b) => b !== undefined);
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) expect(overlaps(kids[i], kids[j]), `${kids[i].id} × ${kids[j].id}`).toBe(false);
      }
    }
  });

  it.each(states)("draws every edge and loop, with loop lanes clear of the boxes (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    expect(layout.edges.map((e) => e.id)).toEqual(EDGES.map((e) => e.id));
    expect(layout.loops.map((l) => l.id)).toEqual(LOOPS.map((l) => l.id));
    const boxes = top(layout);
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    expect(minY).toBeGreaterThan(LAYOUT.LANE_INNER + 12);
    expect(maxY).toBeLessThan(layout.height - LAYOUT.LANE_INNER - 12);
    expect(maxX).toBeLessThan(layout.width - LAYOUT.LANE_INNER - 12);
    for (const p of [...layout.edges, ...layout.loops]) {
      expect(p.labelX, p.id).toBeGreaterThan(0);
      expect(p.labelX, p.id).toBeLessThan(layout.width);
      expect(p.labelY, p.id).toBeGreaterThan(0);
      expect(p.labelY, p.id).toBeLessThan(layout.height);
      for (const n of p.path.match(/-?\d+(\.\d+)?/g)!.map(Number)) expect(Number.isFinite(n), p.id).toBe(true);
    }
  });

  it("hides the items of collapsed subgroups", () => {
    const layout = layoutMap(new Set(["training"]));
    expect(layout.boxes.get("training")?.collapsed).toBe(true);
    expect(layout.boxes.has("pretraining")).toBe(false);
    expect(layoutMap(new Set()).boxes.has("pretraining")).toBe(true);
  });

  it("paints groups before their contents", () => {
    const { order, boxes } = layoutMap();
    const rank = (id: string) => order.indexOf(id);
    for (const b of boxes.values()) {
      const parent = ELEMENTS.get(b.id)?.parent;
      if (parent) expect(rank(parent), b.id).toBeLessThan(rank(b.id));
    }
  });
});

describe("capability map: relations", () => {
  it("links the model to the harness and the harness to getting work done", () => {
    const harness = relatedIds("harness");
    expect(harness).toContain("model");
    expect(harness).toContain("system");
    expect(harness).toContain("inference");
    const model = relatedIds("model");
    expect(model).toContain("harness");
    expect(model).toContain("measure-model");
    expect(model).not.toContain("system");
    const system = relatedIds("system");
    expect(system).toContain("harness");
    expect(system).toContain("measure-system");
    expect(system).toContain("uses");
    expect(system).not.toContain("model");
  });

  it("lets an item borrow its parent's links without lighting up its siblings", () => {
    const loop = relatedIds("agent-loop");
    expect(loop).toContain("harness");
    expect(loop).toContain("e-harness");
    expect(loop).toContain("system");
    expect(loop).not.toContain("tools");
    const depth = relatedIds("depth");
    expect(depth).toContain("e-inference");
    expect(depth).toContain("harness");
    expect(depth).not.toContain("width");
    expect(depth).not.toContain("e-algorithmic");
  });

  it("keeps the frames of related items visible", () => {
    for (const id of ["rlvr", "metr", "hbm", "synthetic"]) {
      const related = relatedIds(id);
      for (const a of ancestors(id)) expect(related, `${id} → ${a}`).toContain(a);
    }
  });

  it("selects an edge with both ends, and a loop with its cycle", () => {
    const edge = relatedIds("e-harness");
    expect([...edge]).toEqual(expect.arrayContaining(["e-harness", "harness", "system", ...descendants("harness")]));
    const loop = relatedIds("loop-research");
    expect([...loop]).toEqual(expect.arrayContaining(["loop-research", "ai-research", "e-algorithmic", "training", "model"]));
  });

  it("highlights each company's and key point's focus", () => {
    for (const c of COMPANIES) {
      const related = relatedIds(c.id);
      for (const f of c.focus) expect(related, `${c.id} → ${f}`).toContain(f);
    }
    for (const k of KEY_POINTS) {
      const related = relatedIds(k.id);
      for (const f of k.ids) expect(related, `${k.id} → ${f}`).toContain(f);
    }
  });

  it("puts the loops on the elements they pass through", () => {
    expect(relatedIds("deployment-traces")).toContain("loop-deployment");
    expect(relatedIds("synthetic")).toContain("loop-synthetic");
    expect(relatedIds("ai-research")).toContain("loop-research");
  });
});
