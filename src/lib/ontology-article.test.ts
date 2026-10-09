import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { describe, expect, it } from "vitest";
import {
  answer,
  coverageScore,
  enginesInvolved,
  entityTypes,
  interpretations,
  layers,
  metric,
  questionPath,
  relationshipStatus,
  relationships,
  rule,
  sourceOf,
  sources,
  termResolutions,
} from "./ontology-article";

const root = resolve(__dirname, "..", "..");
const slug = "what-is-an-ontology";

function tableColumns(tableId: string): string[] {
  for (const source of sources) {
    const table = source.tables.find((t) => t.id === tableId);
    if (table) return table.columns;
  }
  throw new Error(`Unknown table ${tableId}`);
}

function columnExists(qualified: string): boolean {
  const parts = qualified.split(".");
  const column = parts.pop() as string;
  return tableColumns(parts.join(".")).includes(column);
}

describe("ontology article scenario model", () => {
  it("binds every entity type to a table of its own source, keyed by an existing column", () => {
    for (const entity of entityTypes) {
      const source = sourceOf(entity);
      const table = source.tables.find((t) => t.id === entity.staticBinding.table);
      expect(table, `${entity.id} static binding`).toBeDefined();
      expect(table?.columns).toContain(entity.key);
    }
  });

  it("binds the time series through a column present on both sides", () => {
    const container = entityTypes.find((e) => e.id === "Container");
    const ts = container?.timeSeries;
    expect(ts).toBeDefined();
    if (!container || !ts) return;
    expect(tableColumns(container.staticBinding.table)).toContain(ts.joinColumn);
    expect(tableColumns(ts.table)).toEqual(expect.arrayContaining([ts.joinColumn, ts.property]));
    expect(sources.find((s) => s.id === ts.source)?.engine).toBe("KQL");
  });

  it("only relates existing entity types through existing columns or mapping tables", () => {
    const ids = new Set(entityTypes.map((e) => e.id));
    for (const rel of relationships) {
      expect(ids.has(rel.from)).toBe(true);
      expect(ids.has(rel.to)).toBe(true);
      if (rel.binding.kind === "column") {
        expect(columnExists(rel.binding.fromColumn), rel.binding.fromColumn).toBe(true);
        expect(columnExists(rel.binding.toColumn), rel.binding.toColumn).toBe(true);
      } else {
        const keys = [
          entityTypes.find((e) => e.id === rel.from)?.key,
          entityTypes.find((e) => e.id === rel.to)?.key,
        ];
        expect(tableColumns(rel.binding.table)).toEqual(expect.arrayContaining(keys));
      }
    }
  });

  it("marks exactly the boundary-crossing relationships as cross-system", () => {
    for (const rel of relationships) {
      const from = entityTypes.find((e) => e.id === rel.from);
      const to = entityTypes.find((e) => e.id === rel.to);
      if (!from || !to) throw new Error("missing entity");
      const differentSources = from.staticBinding.source !== to.staticBinding.source;
      expect(rel.binding.crossSystem, rel.id).toBe(differentSources);
    }
  });

  it("forms a connected path for the competency question", () => {
    const touched = new Set(
      questionPath.flatMap((id) => {
        const rel = relationships.find((r) => r.id === id);
        return rel ? [rel.from, rel.to] : [];
      }),
    );
    expect([...touched].sort()).toEqual(entityTypes.map((e) => e.id).sort());
    expect(rule.linkedTo).toEqual(["Container"]);
    expect(entityTypes.map((e) => e.id)).toContain(metric.linkedTo);
  });

  it("resolves every highlighted term to something that exists", () => {
    for (const { target } of termResolutions) {
      if (target.kind === "entity") {
        expect(entityTypes.some((e) => e.id === target.id)).toBe(true);
      }
      if (target.kind === "property") {
        const entity = entityTypes.find((e) => e.id === target.entity);
        expect(entity).toBeDefined();
        if (entity) expect(tableColumns(entity.staticBinding.table)).toContain(target.property);
      }
    }
  });

  it("answers fully only when keys align and the crosswalk exists", () => {
    const full = answer({ hasCrosswalk: true, keysAligned: true });
    expect(full.broken).toEqual([]);
    expect(full.rows.map((r) => r.orderAmountJpy)).toEqual(
      [...full.rows.map((r) => r.orderAmountJpy)].sort((a, b) => b - a),
    );
    expect(full.rows.some((r) => r.account === null)).toBe(true);

    const noCrosswalk = answer({ hasCrosswalk: false, keysAligned: true });
    expect(noCrosswalk.broken).toEqual(["billedAs"]);
    expect(noCrosswalk.rows).toHaveLength(full.rows.length);
    expect(noCrosswalk.rows.every((r) => r.account === null)).toBe(true);

    const misaligned = answer({ hasCrosswalk: true, keysAligned: false });
    expect(misaligned.broken).toEqual(["fulfilledBy"]);
    expect(misaligned.rows).toEqual([]);

    expect(relationshipStatus("billedAs", { hasCrosswalk: false, keysAligned: true })).toBe("unbound");
    expect(relationshipStatus("fulfilledBy", { hasCrosswalk: true, keysAligned: false })).toBe("no-match");
  });

  it("needs three different engines, as the article claims", () => {
    expect(enginesInvolved()).toEqual(["DAX", "KQL", "SQL"]);
  });
});

describe("ontology interpretation map", () => {
  it("rates every artifact on every layer and keeps ids unique", () => {
    const ids = interpretations.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of interpretations) {
      expect(Object.keys(item.coverage).sort()).toEqual(layers.map((l) => l.id).sort());
      for (const text of [item.name, item.example, item.spectrum, item.misses]) {
        expect(text.ja.length).toBeGreaterThan(0);
        expect(text.en.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the ratings consistent with the article's argument", () => {
    const byId = Object.fromEntries(interpretations.map((i) => [i.id, i]));
    expect(byId["table-descriptions"].anchor).toBe("physical");
    expect(byId["fabric-ontology"].coverage.binding).toBe("full");
    expect(byId["fabric-ontology"].coverage.structure).toBe("partial");
    expect(byId.owl.coverage.structure).toBe("full");
    expect(byId.owl.coverage.binding).toBe("none");
    expect(coverageScore(byId["table-descriptions"])).toBeLessThan(coverageScore(byId["fabric-ontology"]));
  });
});

const articles = ["ja", "en"].map((locale) => {
  const path = resolve(root, "content", "blog", locale, `${slug}.mdx`);
  return { locale, path, source: existsSync(path) ? readFileSync(path, "utf8") : "" };
});

describe("ontology bilingual article contract", () => {
  it("exists in both locales", () => {
    for (const article of articles) expect(article.source.length, article.path).toBeGreaterThan(0);
  });

  it("registers both demos in the component map and uses each once per article", () => {
    const page = readFileSync(resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"), "utf8");
    const index = readFileSync(resolve(root, "src", "components", "interactive", "index.ts"), "utf8");
    for (const name of ["OntologyInterpretationMap", "SemanticViewWalkthrough"]) {
      expect(page).toContain(`${name}: () => <${name} locale={locale} />`);
      expect(index).toContain(name);
      for (const article of articles) {
        expect(article.source.match(new RegExp(`<${name} />`, "g")), article.locale).toHaveLength(1);
      }
    }
  });

  it("keeps the section structure, code blocks and diagrams parallel between locales", () => {
    const shape = (source: string) => ({
      h2: (source.match(/^## /gm) ?? []).length,
      h3: (source.match(/^### /gm) ?? []).length,
      fences: (source.match(/^```[a-z]+/gm) ?? []).join(","),
      tables: (source.match(/^\|[-: |]+\|\s*$/gm) ?? []).length,
    });
    const [ja, en] = articles;
    expect(shape(en.source)).toEqual(shape(ja.source));
  });

  it("tags every fenced code block with a language", () => {
    for (const article of articles) {
      const fences = article.source.match(/^```.*$/gm) ?? [];
      for (let i = 0; i < fences.length; i += 2) {
        expect(fences[i], `${article.locale} fence #${i / 2}`).toMatch(/^```[a-z]+/);
      }
    }
  });

  it("keeps local article links resolvable in their own locale", () => {
    for (const article of articles) {
      for (const match of article.source.matchAll(/\]\(\/(ja|en)\/blog\/([^/)#]+)\/?(?:#[^)]*)?\)/g)) {
        expect(match[1]).toBe(article.locale);
        expect(existsSync(resolve(root, "content", "blog", match[1], `${match[2]}.mdx`))).toBe(true);
      }
    }
  });

  it.each(articles)("compiles as MDX with the site's remark plugins: $locale", async (article) => {
    const compiled = await serialize(article.source, {
      parseFrontmatter: true,
      mdxOptions: { remarkPlugins: [remarkGfm, remarkMath] },
    });
    expect(compiled.compiledSource.length).toBeGreaterThan(1000);
    expect(compiled.frontmatter).toMatchObject({ title: expect.any(String), date: "2026-10-09" });
  });
});
