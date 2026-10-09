import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { describe, expect, it } from "vitest";
import {
  RUNNING_EXAMPLE,
  WORST_CASE,
  deferredAcceptance,
  orient,
} from "./stable-matching";

const root = resolve(__dirname, "..", "..");
const slug = "gale-shapley";
const articles = ["ja", "en"].map((locale) => ({
  locale,
  source: readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8"),
}));

const COMPONENTS = [
  "BlockingPairExplorer",
  "GaleShapleyVisualizer",
  "StableLatticeExplorer",
  "MatchingStrategyLab",
  "RandomMarketLab",
  "ResidencyMatchVisualizer",
  "MatchingTimeline",
  "SchoolChoiceTradeoff",
];

function pythonBlocks(source: string): string[] {
  return Array.from(source.matchAll(/^```python\r?\n([\s\S]*?)^```[ \t]*$/gm), (m) =>
    m[1]
      .replace(/"""[\s\S]*?"""/g, "")
      .split(/\r?\n/)
      .map((line) => line.replace(/(^|\s+)#.*$/, "").trimEnd())
      .filter((line) => line.trim() !== "")
      .join("\n"),
  );
}

describe("Gale–Shapley article contract", () => {
  it("registers every demo once per article and in the MDX component map", () => {
    const page = readFileSync(
      resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"),
      "utf8",
    );
    const index = readFileSync(
      resolve(root, "src", "components", "interactive", "index.ts"),
      "utf8",
    );
    for (const name of COMPONENTS) {
      expect(page).toContain(`${name}: () => <${name} locale={locale} />`);
      expect(index).toContain(`export { ${name} }`);
      for (const article of articles) {
        expect(article.source.match(new RegExp(`<${name} />`, "g")), `${article.locale} ${name}`).toHaveLength(1);
      }
    }
  });

  it("keeps the same section structure in both languages", () => {
    const headings = articles.map((a) =>
      Array.from(a.source.matchAll(/^(#{2,3}) (\d+(?:\.\d+)?)?/gm), (m) => `${m[1]}${m[2] ?? ""}`),
    );
    expect(headings[1]).toEqual(headings[0]);
  });

  it("uses identical Python code in both languages (modulo comments)", () => {
    const [ja, en] = articles.map((a) => pythonBlocks(a.source));
    expect(ja.length).toBe(2);
    expect(en).toEqual(ja);
  });

  it("states numbers that match the model", () => {
    const { P, R } = orient(RUNNING_EXAMPLE, "left");
    expect(deferredAcceptance(P, R).totalProposals).toBe(7);
    const worst = orient(WORST_CASE, "left");
    expect(deferredAcceptance(worst.P, worst.R).totalProposals).toBe(13);
    for (const article of articles) {
      expect(article.source).toContain("AX BW CY DZ");
      expect(article.source).toContain("AZ BY CW DX");
      expect(article.source).toContain("AW BX CY DZ");
      expect(article.source).toContain("n^2 - n + 1");
    }
  });

  it.each(articles)("compiles as MDX: $locale", async (article) => {
    const compiled = await serialize(article.source, {
      parseFrontmatter: true,
      mdxOptions: { remarkPlugins: [remarkGfm, remarkMath] },
    });
    expect(compiled.compiledSource.length).toBeGreaterThan(1000);
    expect(compiled.frontmatter).toMatchObject({ title: expect.any(String), date: "2026-10-01" });
  });
});
