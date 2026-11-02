import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./capability-map";

const root = resolve(__dirname, "..", "..");
const slug = "ai-industry-capital-to-fcf";
const articles = (["ja", "en"] as const).map((locale) => ({
  locale,
  source: readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8"),
}));

const section = (source: string, from: string, to: string) => source.slice(source.indexOf(from), source.indexOf(to));

const HARNESS_LEAD = { ja: "<strong>ハーネス。</strong>", en: "<strong>The harness.</strong>" } as const;
const CONTEXT_LEAD = { ja: "<strong>推論時の文脈。</strong>", en: "<strong>Inference-time context.</strong>" } as const;
const SCAFFOLD = { ja: "スキャフォールド", en: "scaffold" } as const;

describe("ai-industry-capital-to-fcf: capability lever map", () => {
  it.each(articles)("places the map once, inside §5.2 ($locale)", ({ source }) => {
    expect(source.match(/<CapabilityLeverMap \/>/g)).toHaveLength(1);
    expect(source).not.toContain("CapabilityLeversLab");
    const figure = source.indexOf("<CapabilityLeverMap />");
    expect(figure).toBeGreaterThan(source.indexOf("\n### 5.2 "));
    expect(figure).toBeLessThan(source.indexOf("\n### 5.3 "));
  });

  it("is registered as an MDX component", () => {
    const page = readFileSync(resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"), "utf8");
    expect(page).toContain("CapabilityLeverMap: () => <CapabilityLeverMap locale={locale} />");
    const index = readFileSync(resolve(root, "src", "components", "interactive", "index.ts"), "utf8");
    expect(index).toContain('export { CapabilityLeverMap } from "./CapabilityLeverMap";');
  });

  it.each(articles)("discusses the harness in §5.2, before the map ($locale)", ({ locale, source }) => {
    const s52 = section(source, "\n### 5.2 ", "\n### 5.3 ");
    const harness = s52.indexOf(HARNESS_LEAD[locale]);
    expect(harness).toBeGreaterThan(0);
    expect(harness).toBeLessThan(s52.indexOf("<CapabilityLeverMap />"));
    expect(s52).toMatch(/^\| (ハーネス（|Harness \()/m);
  });

  it.each(articles)("discusses inference-time context (the IQ layer) after the harness and in Microsoft's bet ($locale)", ({ locale, source }) => {
    const s52 = section(source, "\n### 5.2 ", "\n### 5.3 ");
    const context = s52.indexOf(CONTEXT_LEAD[locale]);
    expect(context).toBeGreaterThan(s52.indexOf(HARNESS_LEAD[locale]));
    expect(context).toBeLessThan(s52.indexOf("<CapabilityLeverMap />"));
    expect(s52).toMatch(/^\| (推論時の文脈（情報源、検索、権限）|Inference-time context \(sources, retrieval, permissions\)) \|/m);
    const s73 = section(source, "\n### 7.3 ", "\n## 8. ");
    const terms = locale === "ja" ? ["Microsoft IQ", "Work IQ", "6 万近く", "company knowledge"] : ["Microsoft IQ", "Work IQ", "nearly 60,000", "company knowledge"];
    for (const term of terms) expect(s73).toContain(term);
    // The same measurement appears in the map's context layer.
    const scores = locale === "ja" ? "59 点から 80 点" : "from 59 to 80";
    expect(s52).toContain(scores);
    expect(ELEMENTS.get("foundry-iq")!.detail.note![locale]).toContain(scores);
  });

  it.each(articles)("says METR measures a model inside a harness ($locale)", ({ locale, source }) => {
    const s52 = section(source, "\n### 5.2 ", "\n### 5.3 ");
    const metr = s52.slice(s52.indexOf("METR"));
    expect(metr.slice(0, 400)).toContain(SCAFFOLD[locale]);
  });

  it.each(articles)("quotes the same harness figures as the map ($locale)", ({ locale, source }) => {
    const paragraph = source.slice(source.indexOf(HARNESS_LEAD[locale])).split("\n")[0];
    const harnessNote = ELEMENTS.get("harness")!.detail.note![locale];
    const subagentsNote = ELEMENTS.get("subagents")!.detail.note![locale];
    for (const figure of ["11%", "18%"]) {
      expect(paragraph).toContain(figure);
      expect(harnessNote).toContain(figure);
    }
    expect(paragraph).toMatch(/4 (倍|times)/);
    expect(paragraph).toMatch(/15 (倍|times)/);
    expect(subagentsNote).toMatch(/\b4 ?(倍|×|x\b)/);
    expect(subagentsNote).toMatch(/\b15 ?(倍|×|x\b)/);
  });

  it.each(articles)("quotes the same RLI figures as the map ($locale)", ({ locale, source }) => {
    const s52 = section(source, "\n### 5.2 ", "\n### 5.3 ");
    const rliNote = ELEMENTS.get("rli")!.detail.note![locale];
    for (const figure of ["2.5%", "21.25%", "Claude Opus 5.5"]) {
      expect(s52).toContain(figure);
      expect(rliNote).toContain(figure);
    }
  });

  it.each(articles)("lists the harness and measurement sources in the references ($locale)", ({ source }) => {
    const refs = source.slice(source.lastIndexOf("\n## "));
    for (const url of [
      "https://arxiv.org/abs/2405.15793",
      "https://www.anthropic.com/research/effective-harnesses-for-long-running-agents",
      "https://www.anthropic.com/research/multi-agent-research-system",
      "https://epoch.ai/eci",
      "https://openai.com/index/gdpval/",
      "https://scale.com/blog/rli",
      "https://labs.scale.com/leaderboard/rli",
      "https://arcprize.org/arc-agi/3",
      "https://arxiv.org/abs/2508.15734",
      "https://arxiv.org/abs/2211.04325",
      "https://arxiv.org/abs/2403.05812",
      "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents",
      "https://www.trychroma.com/research/context-rot",
      "https://arxiv.org/abs/2407.12854",
      "https://learn.microsoft.com/microsoft-iq/",
      "https://www.microsoft.com/en-us/investor/events/fy-2027/earnings-fy-2027-q1",
    ]) {
      expect(refs).toContain(url);
    }
  });

  it("keeps the two language versions aligned line by line", () => {
    const [ja, en] = articles.map((a) => a.source.split("\n"));
    expect(ja.length).toBe(en.length);
    ja.forEach((line, i) => {
      const kind = (l: string) => (l.startsWith("#") ? "heading" : l.startsWith("|") ? "table" : l.trim() === "" ? "blank" : l.startsWith("<") && !l.startsWith("<strong>") ? "tag" : "text");
      expect(kind(en[i]), `line ${i + 1}`).toBe(kind(line));
    });
  });
});
