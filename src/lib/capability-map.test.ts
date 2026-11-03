import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHAIN_LINK,
  COLUMNS,
  COMPANIES,
  DEFAULT_COLLAPSED,
  EDGES,
  ELEMENTS,
  KEY_POINTS,
  LAYOUT,
  LINK_KIND_LABEL,
  LOOPS,
  MONEY_IDS,
  SECTIONS,
  SOURCES,
  SUB_IDS,
  ancestors,
  descendants,
  detailOf,
  kindOf,
  labelOf,
  layoutMap,
  parseRef,
  refLabel,
  relatedIds,
  resolveRef,
  type Detail,
  type Link,
  type MapLayout,
  type Rect,
  type Text,
} from "./capability-map";

const root = resolve(__dirname, "..", "..");
const slug = "ai-industry-capital-to-fcf";
const sources = Object.fromEntries(
  (["ja", "en"] as const).map((locale) => [locale, readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8")]),
) as Record<"ja" | "en", string>;

/** Body text of each numbered section, with bold tags and link targets removed. */
function sectionBodies(source: string): Map<string, { title: string; body: string }> {
  const plain = source.replace(/<\/?strong>/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const out = new Map<string, { title: string; body: string }>();
  let current: { title: string; lines: string[] } | null = null;
  const flush = (id: string | null) => {
    if (id && current) out.set(id, { title: current.title, body: current.lines.join("\n") });
  };
  let currentId: string | null = null;
  for (const line of plain.split("\n")) {
    const heading = line.match(/^#{2,3} (\d+(?:\.\d+)?)\.? (.*)$/);
    if (heading) {
      flush(currentId);
      currentId = heading[1];
      current = { title: heading[2], lines: [] };
      continue;
    }
    if (/^## /.test(line)) {
      flush(currentId);
      currentId = null;
      current = null;
      continue;
    }
    current?.lines.push(line);
  }
  flush(currentId);
  return out;
}

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

/** Every list of refs and links in the map, keyed by where it appears. */
const allRefs: [string, string[]][] = [
  ...details.map(([id, d]) => [id, d.refs ?? []] as [string, string[]]),
  ...COMPANIES.map((c) => [c.id, c.refs ?? []] as [string, string[]]),
  ...KEY_POINTS.map((k) => [k.id, k.refs ?? []] as [string, string[]]),
];
const allLinks: [string, Link[]][] = [
  ...details.map(([id, d]) => [id, d.links ?? []] as [string, Link[]]),
  ...COMPANIES.map((c) => [c.id, c.links ?? []] as [string, Link[]]),
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
  }
  for (const e of EDGES) {
    if (e.label) out.push([`${e.id}.label`, e.label]);
    if (e.kicker) out.push([`${e.id}.kicker`, e.kicker]);
  }
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

type Point = [number, number];
/** The corner points of a path made of M, L and Q commands, in order. */
function pathPoints(d: string): Point[] {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const out: Point[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  return out;
}
const strictlyIn = (p: Point, r: Rect) => p[0] > r.x && p[0] < r.x + r.w && p[1] > r.y && p[1] < r.y + r.h;
const onOrIn = (p: Point, r: Rect) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;

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

  it("feeds getting work done from the context layer (IQ), apart from the harness", () => {
    expect(ELEMENTS.get("context-layer")).toMatchObject({ kind: "group", category: "context" });
    expect(ELEMENTS.get("context-layer")?.children).toEqual(["context-sources", "context-delivery"]);
    expect(ELEMENTS.get("context-sources")?.children).toEqual(["work-iq", "fabric-iq", "foundry-iq", "web-iq"]);
    expect(ELEMENTS.get("context-delivery")?.children).toEqual(["search-ranking", "permissions"]);
    expect(EDGES.find((e) => e.id === "e-context")).toMatchObject({ from: "context-layer", to: "system", kind: "flow" });
    // "Context length" is a property of the model; the context layer is what gets brought in.
    expect(ELEMENTS.get("context")?.parent).toBe("size");
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
    const bodies = sectionBodies(sources[locale]);
    for (const [id, refs] of allRefs) {
      for (const ref of refs) {
        const { section, point } = parseRef(ref);
        expect(bodies.has(section), `${id} → ${ref}`).toBe(true);
        expect(SECTIONS[section], `${id} → ${ref} has no SECTIONS entry`).toBeDefined();
        if (point) expect(SECTIONS[section].points[point], `${id} → ${ref}`).toBeDefined();
        expect(resolveRef(ref), `${id} → ${ref}`).toBeDefined();
      }
    }
  });

  it.each(["ja", "en"] as const)("quotes the article verbatim, under the right heading (%s)", (locale) => {
    const bodies = sectionBodies(sources[locale]);
    for (const [section, def] of Object.entries(SECTIONS)) {
      const found = bodies.get(section);
      expect(found, section).toBeDefined();
      expect(found!.title, section).toBe(def.title[locale]);
      for (const [key, quote] of Object.entries(def.points)) expect(found!.body, `${section}:${key}`).toContain(quote[locale]);
    }
  });

  it("gives every panel, company and key point something to read next", () => {
    for (const [id, d] of details) expect(d.links?.length ?? 0, `${id} has no sources`).toBeGreaterThan(0);
    for (const c of COMPANIES) {
      expect(c.links?.length ?? 0, c.id).toBeGreaterThan(0);
      expect(c.refs?.length ?? 0, c.id).toBeGreaterThan(0);
    }
    for (const k of KEY_POINTS) expect(k.refs?.length ?? 0, k.id).toBeGreaterThan(0);
    const cited = Object.keys(SECTIONS).filter((s) => allRefs.some(([, refs]) => refs.some((r) => parseRef(r).section === s)));
    expect(cited.sort()).toEqual(Object.keys(SECTIONS).sort());
  });

  it("uses well-formed links, each listed once per panel", () => {
    for (const [id, links] of allLinks) {
      const keys = links.map((l) => l.href ?? l.slug);
      expect(new Set(keys).size, `${id} lists a source twice`).toBe(keys.length);
      for (const l of links) {
        expect(LINK_KIND_LABEL[l.kind], `${id} → ${l.ja}`).toBeDefined();
        expect(Boolean(l.href) !== Boolean(l.slug), id).toBe(true);
        expect(l.ja.trim() && l.en.trim(), id).toBeTruthy();
        if (l.href) {
          expect(l.href, id).toMatch(/^https:\/\//);
          expect(l.meta?.ja.trim() && l.meta?.en.trim(), `${id} → ${l.href} needs an author or publisher`).toBeTruthy();
        }
        expect(l.kind === "post", `${id} → ${l.ja}`).toBe(Boolean(l.slug));
      }
    }
  });

  it("uses every registered source somewhere", () => {
    const used = new Set(allLinks.flatMap(([, links]) => links));
    const unused = Object.entries(SOURCES)
      .filter(([, l]) => !used.has(l))
      .map(([key]) => key);
    expect(unused).toEqual([]);
  });

  it("titles every source distinctly, since inline lists show titles without the publisher", () => {
    for (const locale of ["ja", "en"] as const) {
      const titles = Object.values(SOURCES).map((l) => l[locale]);
      const repeated = titles.filter((title, i) => titles.indexOf(title) !== i);
      expect(repeated, locale).toEqual([]);
    }
  });

  it("links only to posts that exist in both languages", () => {
    for (const [id, links] of allLinks) {
      for (const l of links) {
        if (!l.slug) continue;
        for (const locale of ["ja", "en"]) {
          expect(existsSync(resolve(root, "content", "blog", locale, `${l.slug}.mdx`)), `${id} → ${locale}/${l.slug}`).toBe(true);
        }
      }
    }
  });

  it("formats and resolves section references", () => {
    expect(refLabel("4.4", "ja")).toBe("第 4.4 節");
    expect(refLabel("4.6:tts", "ja")).toBe("第 4.6 節");
    expect(refLabel("2", "ja")).toBe("第 2 章");
    expect(refLabel("4.4", "en")).toBe("Section 4.4");
    expect(refLabel("2", "en")).toBe("Chapter 2");
    expect(resolveRef("4.6")?.quote).toBe(Object.values(SECTIONS["4.6"].points)[0]);
    expect(resolveRef("4.6:tts")?.quote).toBe(SECTIONS["4.6"].points.tts);
    expect(resolveRef("4.6:nope")).toBeUndefined();
    expect(resolveRef("9.9")).toBeUndefined();
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
    const band = boxes.filter((b) => MONEY_IDS.includes(b.id));
    const below = boxes.filter((b) => !MONEY_IDS.includes(b.id));
    // The lane under the money band clears the band's nodes (the capital group hangs below it over column A).
    for (const b of band.filter((x) => x.id !== "capital")) expect(b.y + b.h, b.id).toBeLessThan(LAYOUT.LANE_TOP - 12);
    expect(Math.min(...below.map((b) => b.y))).toBeGreaterThan(LAYOUT.LANE_TOP + 12);
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
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

  it.each(states)("puts the context layer under the system it feeds (%s)", (_, collapsed) => {
    const { boxes } = layoutMap(collapsed);
    const system = boxes.get("system")!;
    const context = boxes.get("context-layer")!;
    expect(context.x).toBe(system.x);
    expect(context.y).toBeGreaterThan(system.y + system.h);
  });

  it.each(states)("routes loops around the boxes they do not start or end in (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    const boxes = top(layout);
    for (const loop of layout.loops) {
      const points = pathPoints(loop.path);
      const ends = [points[0], points[points.length - 1]];
      const others = boxes.filter((b) => !ends.some((p) => onOrIn(p, b)));
      for (let i = 1; i < points.length; i++) {
        const [a, b] = [points[i - 1], points[i]];
        for (let s = 0; s <= 24; s++) {
          const p: Point = [a[0] + ((b[0] - a[0]) * s) / 24, a[1] + ((b[1] - a[1]) * s) / 24];
          for (const box of others) expect(strictlyIn(p, box), `${loop.id} runs through ${box.id}`).toBe(false);
        }
      }
    }
    // The synthetic-data loop leaves the system sideways, so it must not cut through the context layer below it.
    expect(pathPoints(layout.loops.find((l) => l.id === "loop-synthetic")!.path)[0][0]).toBe(layout.boxes.get("system")!.x);
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

describe("capability map: the chain from capital to FCF", () => {
  const chainEdges = EDGES.filter((e) => e.kind === "money" || e.chain);
  const top = (layout: MapLayout) => [...layout.boxes.values()].filter((b) => b.depth === 0);

  it("numbers the ten links of §2.1 on boxes that are always drawn", () => {
    const entries = Object.entries(CHAIN_LINK).sort((a, b) => a[1] - b[1]);
    expect(entries.map(([, n]) => n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const [id] of entries) expect(ELEMENTS.has(id), id).toBe(true);
    for (const id of MONEY_IDS) expect(ELEMENTS.get(id)?.category, id).toBe("money");
    for (const [state, collapsed] of states) {
      const { boxes } = layoutMap(collapsed);
      for (const [id] of entries) expect(boxes.has(id), `${id} (${state})`).toBe(true);
    }
    expect(KEY_POINTS[0].id).toBe("kp-chain");
  });

  it("runs from capital through every link to FCF and back to capital", () => {
    // Each money arrow joins one link to the next.
    for (const e of EDGES.filter((x) => x.kind === "money")) {
      expect(CHAIN_LINK[e.to], e.id).toBe((CHAIN_LINK[e.from] % 10) + 1);
    }
    // In between, the chain runs through the capability layer; a box counts as reaching what it contains and is contained in.
    const next = new Map<string, Set<string>>();
    const link = (a: string, b: string) => next.set(a, (next.get(a) ?? new Set()).add(b));
    for (const e of chainEdges) link(e.from, e.to);
    for (const el of ELEMENTS.values()) {
      if (!el.parent) continue;
      link(el.parent, el.id);
      link(el.id, el.parent);
    }
    const reach = (start: string) => {
      const seen = new Set([start]);
      const queue = [start];
      while (queue.length) {
        for (const n of next.get(queue.shift()!) ?? []) {
          if (seen.has(n)) continue;
          seen.add(n);
          queue.push(n);
        }
      }
      return seen;
    };
    const fromCapital = reach("capital");
    for (const id of Object.keys(CHAIN_LINK)) expect(fromCapital, id).toContain(id);
    expect(reach("fcf")).toContain("capital");
  });

  it.each(states)("puts the money links along the top, each over a column, reading right to left (%s)", (_, collapsed) => {
    const { boxes, edges } = layoutMap(collapsed);
    const columnX = Object.values(COLUMNS).map((c) => c.x);
    for (const id of MONEY_IDS) {
      expect(boxes.get(id)!.y, id).toBe(LAYOUT.BAND_Y);
      expect(columnX, id).toContain(boxes.get(id)!.x);
    }
    for (const id of ["chain-gross", "chain-operating", "chain-fcf", "chain-next"]) {
      const def = EDGES.find((e) => e.id === id)!;
      expect(boxes.get(def.from)!.x, id).toBeGreaterThan(boxes.get(def.to)!.x);
      const points = pathPoints(edges.find((e) => e.id === id)!.path);
      expect(points[0][1], id).toBe(points[points.length - 1][1]);
    }
    const capital = boxes.get("capital")!;
    const resources = boxes.get("resources")!;
    expect(capital.x).toBe(resources.x);
    expect(capital.y + capital.h).toBeLessThan(resources.y);
  });

  it.each(states)("takes the uses to revenue round the right-hand side, clear of other boxes (%s)", (_, collapsed) => {
    const layout = layoutMap(collapsed);
    const points = pathPoints(layout.edges.find((e) => e.id === "chain-revenue")!.path);
    const others = top(layout).filter((b) => b.id !== "uses" && b.id !== "revenue");
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      for (let s = 0; s <= 24; s++) {
        const p: Point = [a[0] + ((b[0] - a[0]) * s) / 24, a[1] + ((b[1] - a[1]) * s) / 24];
        for (const box of others) expect(strictlyIn(p, box), `chain-revenue runs through ${box.id}`).toBe(false);
      }
    }
    expect(Math.max(...points.map((p) => p[0]))).toBe(layout.width - LAYOUT.LANE_OUTER);
  });

  it("ties each deducted cost to the link it comes from", () => {
    const ties = (id: string) => EDGES.find((e) => e.id === id)?.ties;
    expect(ties("chain-gross")).toEqual(["inference"]);
    expect(ties("chain-operating")).toEqual(["training"]);
    expect(ties("chain-fcf")).toEqual(["resources"]);
    for (const e of EDGES.filter((x) => x.kind === "money")) {
      expect(e.label && e.kicker && e.detail, e.id).toBeTruthy();
      for (const tie of e.ties ?? []) expect(CHAIN_LINK[tie], `${e.id} → ${tie}`).toBeDefined();
    }
    const inference = relatedIds("inference");
    expect(inference).toContain("chain-gross");
    expect(inference).toContain("gross-profit");
    expect(relatedIds("chain-gross")).toContain("inference");
    // Items borrow their stage's tie: pretraining lights up the training cost on its way to operating profit.
    expect(relatedIds("pretraining")).toContain("chain-operating");
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
    expect(system).toContain("context-layer");
    const workIq = relatedIds("work-iq");
    expect(workIq).toContain("e-context");
    expect(workIq).toContain("system");
    expect(workIq).not.toContain("foundry-iq");
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
