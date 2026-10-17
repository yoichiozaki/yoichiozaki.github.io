import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GATE_PARAMS,
  FIGURE3_READINGS,
  type GateParams,
  abSampleSizePerArm,
  bandFalseAlarmRateR3,
  bandWidthForFalseAlarmR3,
  canaryDetection,
  certificationSampleSize,
  familywiseAlarmRate,
  fitRetryCurve,
  humanBandCheck,
  independentEscapeProbability,
  maxEscapeProbability,
  noJudgeSummary,
  requiredSampleSize,
  sdIntervalMultipliersDf2,
  selfInclusionAgreement,
  servedDefectRate,
  servedStrata,
  servedStrataSweep,
  retryMarginalValue,
  signTestTwoSided,
  simulateGate,
  stratifiedSampleSpecificity,
  summarizeGate,
  wilsonInterval,
} from "./llm-judge-lifecycle";

const root = resolve(__dirname, "..", "..");
const slug = "llm-as-a-judge-lifecycle";
const articles = ["ja", "en"].map((locale) => ({
  locale,
  source: readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8"),
}));

function codeBlocks(source: string, lang: string): string[] {
  const fence = new RegExp("^```" + lang + "\\r?\\n([\\s\\S]*?)^```[ \\t]*$", "gm");
  return Array.from(source.matchAll(fence), (m) =>
    m[1]
      .replace(/"""[\s\S]*?"""/g, "")
      .split(/\r?\n/)
      .map((line) => (lang === "python" ? line.replace(/(^|\s+)#.*$/, "") : line).trimEnd())
      .filter((line) => line.trim() !== "")
      .join("\n"),
  );
}

const pct1 = (x: number) => `${(x * 100).toFixed(1)}%`;
const per10k = (x: number) => Math.round(x * 1e4).toLocaleString("en-US");
const at = (overrides: Partial<GateParams>) => summarizeGate(simulateGate({ ...DEFAULT_GATE_PARAMS, ...overrides }));
const sortedSet = (xs: number[]) => [...new Set(xs)].sort((a, b) => a - b);

function expandNumbers(text: string): number[] {
  const out: number[] = [];
  for (const m of text.replace(/（[^）]*）|\([^)]*\)/g, "").matchAll(/(\d+)(?:\s*[〜–]\s*(\d+))?/g)) {
    for (let i = Number(m[1]); i <= Number(m[2] ?? m[1]); i++) out.push(i);
  }
  return out;
}

/** §7.2 priority table: key-decision numbers per section for "before enforcement" and "first quarter". */
function priorityTable(source: string): Record<string, { before: number[]; quarter: number[] }> {
  const rows = Array.from(source.matchAll(/^\| Phase [^|]*§(7\.\d)[^|]*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/gm));
  return Object.fromEntries(
    rows.map(([, section, before, quarter]) => [section, { before: sortedSet(expandNumbers(before)), quarter: sortedSet(expandNumbers(quarter)) }]),
  );
}

/** §7.16 checklist items with their required marker and trailing key-decision references. */
function checklist(source: string) {
  const body = source.slice(source.indexOf("### 7.16"), source.indexOf("## 8."));
  return body
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- [ ] "))
    .map((line) => {
      const required = line.startsWith("- [ ] 〔必須〕") || line.startsWith("- [ ] <strong>[required]</strong>");
      const tail = line.match(/[（(](§[^（）()]*)[）)]\s*$/);
      const refs: Record<string, number[]> = {};
      for (const m of (tail?.[1] ?? "").matchAll(/§(7\.\d+)(?: の |, items? )?([\d〜–、, and]*)/g)) {
        refs[m[1]] = sortedSet([...(refs[m[1]] ?? []), ...expandNumbers(m[2])]);
      }
      return { required, hasRef: tail !== null, refs };
    });
}

describe("LLM-as-a-Judge lifecycle article contract", () => {
  it("registers the simulator once per article and in the MDX component map", () => {
    const page = readFileSync(resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"), "utf8");
    const index = readFileSync(resolve(root, "src", "components", "interactive", "index.ts"), "utf8");
    expect(page).toContain("JudgeGateSimulator: () => <JudgeGateSimulator locale={locale} />");
    expect(index).toContain('export { JudgeGateSimulator } from "./JudgeGateSimulator"');
    for (const article of articles) {
      expect(article.source.match(/<JudgeGateSimulator \/>/g), article.locale).toHaveLength(1);
    }
  });

  it("keeps the same section structure in both languages", () => {
    const headings = articles.map((a) =>
      Array.from(a.source.matchAll(/^(#{2,3}) (\d+(?:\.\d+)?)?/gm), (m) => `${m[1]}${m[2] ?? ""}`),
    );
    expect(headings[1]).toEqual(headings[0]);
  });

  it("uses identical code in both languages (Python modulo comments)", () => {
    for (const lang of ["python", "json", "mermaid"]) {
      const [ja, en] = articles.map((a) => codeBlocks(a.source, lang));
      if (lang === "mermaid") {
        expect(ja.length, "mermaid block count").toBe(en.length);
        continue;
      }
      expect(ja.length, lang).toBeGreaterThan(0);
      expect(en, lang).toEqual(ja);
    }
  });

  it("states simulator numbers that match the model", () => {
    const none = noJudgeSummary(DEFAULT_GATE_PARAMS);
    const rows = [
      at({ retryBudget: 0 }),
      at({ retryBudget: 3 }),
      at({ retryBudget: 3, persistence: 0 }),
      at({ retryBudget: 3, persistence: 1 }),
    ];
    const expected = [
      pct1(none.escapeShare),
      per10k(none.escapesPerItem),
      ...rows.flatMap((r) => [pct1(r.servedRate), pct1(r.escapeShare), per10k(r.escapesPerItem)]),
    ];
    expect(expected).toEqual([
      "68.0%", "6,800",
      "32.4%", "21.0%", "680",
      "74.0%", "15.9%", "1,176",
      "77.9%", "21.4%", "1,664",
      "70.1%", "9.8%", "688",
    ]);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
  });

  it("states the retry-amplification table that matches 1 − Spec^(K+1)", () => {
    for (const spec of [0.8, 0.9, 0.95, 0.99]) {
      const row = `| ${spec.toFixed(2)} | ${[0, 1, 2, 3].map((k) => pct1(independentEscapeProbability(spec, k))).join(" | ")} |`;
      for (const article of articles) expect(article.source, `${article.locale} ${row}`).toContain(row);
    }
  });

  it("states the served-strata diagnostics and band calibration that match the model", () => {
    const shares = [1, 0.5, 0].map((persistence) => servedStrata({ ...DEFAULT_GATE_PARAMS, persistence }));
    const strata = (served1: number, served2: number, dropped: number) =>
      stratifiedSampleSpecificity([
        { draws: served1, humanFailRate: 0.05, judgeFails: false },
        { draws: served2, humanFailRate: 0.05, judgeFails: false },
        { draws: dropped, humanFailRate: 0.7, judgeFails: true },
      ]);
    const expected = [
      ...shares.map((s) => `| ${pct1(s.firstPassShare)} | ${pct1(s.postRevisionShare)} |`),
      `${Math.round(maxEscapeProbability(0.9, 3) * 100)}%`,
      `${Math.round(bandFalseAlarmRateR3(2) * 100)}%`,
      `${bandWidthForFalseAlarmR3(0.05).toFixed(2)}s`,
      `${Math.round(familywiseAlarmRate(bandFalseAlarmRateR3(2), 18) * 100)}%`,
      strata(0.5, 0.25, 0.25).toFixed(2),
      strata(100, 100, 100).toFixed(3),
      strata(150, 100, 50).toFixed(2),
      humanBandCheck(0.86, [0.92, 0.88, 0.9], 2, "population").lower.toFixed(3),
    ];
    expect(expected).toEqual([
      "| 21.0% | 0.2% |", "| 21.0% | 11.9% |", "| 21.0% | 21.6% |",
      "40%", "11%", "3.37s", "88%", "0.82", "0.875", "0.74", "0.867",
    ]);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
  });

  it("states the parameter-sweep numbers behind the ρ guidance", () => {
    const independent = servedStrataSweep(0);
    const persistent = servedStrataSweep(1);
    const heavy = servedStrata({ ...DEFAULT_GATE_PARAMS, hardShare: 0.5, persistence: 0 });
    const expected = [
      independent.combinations.toLocaleString("en-US"),
      `−${Math.round(-independent.minGap * 100)}`,
      `+${Math.round(independent.maxGap * 100)}`,
      `${Math.round(persistent.maxPostShare * 100)}%`,
      pct1(heavy.firstPassShare),
      pct1(heavy.postRevisionShare),
    ];
    expect(expected).toEqual(["5,400", "−79", "+72", "16%", "33.3%", "40.7%"]);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
  });

  it("states the retry break-even accounting and the sample sizes behind it", () => {
    const middle = retryMarginalValue(DEFAULT_GATE_PARAMS);
    const persistent = retryMarginalValue({ ...DEFAULT_GATE_PARAMS, persistence: 1 });
    const round = (x: number, to: number) => Math.round(x / to) * to;
    const [w1lo, w1hi] = wilsonInterval(5, 100);
    const [w4lo, w4hi] = wilsonInterval(20, 400);
    const oneSided = 1.644854;
    const wald = Math.ceil((oneSided / (0.97 - 0.95)) ** 2 * 0.97 * 0.03);
    let wilsonN = 10;
    while (wilsonInterval(0.97 * wilsonN, wilsonN, oneSided)[0] < 0.95) wilsonN++;
    const expected = [
      Math.round(middle.addedGood * 1e4).toLocaleString("en-US"),
      String(Math.round(middle.addedBad * 1e4)),
      (Math.round(middle.addedBad * 1e4) * 50).toLocaleString("en-US"),
      round(-middle.net * 1e4, 1000).toLocaleString("en-US"),
      Math.round(persistent.addedGood * 1e4).toLocaleString("en-US"),
      round(persistent.net * 1e4, 100).toLocaleString("en-US"),
      (w1lo * 100).toFixed(1),
      (w1hi * 100).toFixed(1),
      (w4lo * 100).toFixed(1),
      (w4hi * 100).toFixed(1),
      String(round(wald, 10)),
      String(round(wilsonN, 10)),
    ];
    expect(expected).toEqual(["3,661", "496", "24,800", "21,000", "3,758", "3,400", "2.2", "11.2", "3.3", "7.6", "200", "320"]);
    expect(Math.round(persistent.addedBad * 1e4)).toBe(8);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
  });

  it("states the certification power and the Figure 3 fit numbers", () => {
    const roundTo10 = (x: number) => Math.round(x / 10) * 10;
    const power = [
      String(certificationSampleSize(0.95, 0.97, "wald")),
      String(certificationSampleSize(0.95, 0.97, "score")),
      String(roundTo10(certificationSampleSize(0.98, 0.99, "wald"))),
      String(roundTo10(certificationSampleSize(0.98, 0.99, "score"))),
    ];
    expect(power).toEqual(["450", "630", "610", "990"]);
    const ratios = Object.values(FIGURE3_READINGS).map(
      (curve) => fitRetryCurve(curve, true).sse / fitRetryCurve(curve).sse,
    );
    const fits = [
      `1/${Math.round(Math.min(...ratios))}`,
      `1/${Math.round(Math.max(...ratios))}`,
      fitRetryCurve(FIGURE3_READINGS.model3).h.toFixed(2),
    ];
    expect(fits).toEqual(["1/11", "1/57", "0.46"]);
    for (const article of articles) {
      for (const value of [...power, ...fits]) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
  });

  it("states the canary power and the served-cap sample size", () => {
    const six = canaryDetection(150, 0.02, 0.06);
    const ten = canaryDetection(150, 0.02, 0.1);
    const servedCap = Math.round(certificationSampleSize(1 - 0.02, 1 - 0.01, "score") / 10) * 10;
    const expected = [`${Math.round(six.power * 100)}%`, `${Math.round(ten.power * 100)}%`, String(servedCap)];
    expect(expected).toEqual(["55%", "97%", "990"]);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
    expect(articles[0].source).toContain(`閾値は ${six.threshold} 件`);
    expect(articles[1].source).toContain(`threshold at ${six.threshold} flips`);
    const shadowUpper = (wilsonInterval(4, 400, 1.644854)[1] * 100).toFixed(1);
    expect(shadowUpper).toBe("2.2");
    expect(articles[0].source).toContain(`片側 95% の信頼上限は約 ${shadowUpper}%`);
    expect(articles[1].source).toContain(`one-sided 95% upper bound of about ${shadowUpper}%`);
  });

  it("states the familywise, persistence and Figure 3 ratio numbers", () => {
    const weekly = `${Math.round(familywiseAlarmRate(0.05, 18) * 100)}`;
    expect(weekly).toBe("60");
    expect(articles[0].source).toContain(`約 ${weekly}% の週`);
    expect(articles[1].source).toContain(`about ${weekly}% of weeks`);

    // Seed-block ranges measured by running the article's own §8.3 Python (5 blocks × 300 weeks).
    const falseAlarm = { w2: [0.09, 0.123], w337: [0.037, 0.05] };
    const power075 = { w2: [0.797, 0.83], w337: [0.527, 0.58] };
    const fmt = (x: number, digits: number) => (x * 100).toFixed(digits);
    const ranges = [
      falseAlarm.w2.map((p) => fmt(p * p, 1)),
      falseAlarm.w2.map((p) => fmt(familywiseAlarmRate(p * p, 18), 0)),
      falseAlarm.w337.map((p) => fmt(p * p, 2)),
      falseAlarm.w337.map((p) => fmt(familywiseAlarmRate(p * p, 18), 0)),
      power075.w2.map((p) => fmt(p * p, 0)),
      power075.w337.map((p) => fmt(p * p, 0)),
    ];
    expect(ranges).toEqual([["0.8", "1.5"], ["14", "24"], ["0.14", "0.25"], ["2", "4"], ["64", "69"], ["28", "34"]]);
    for (const [lo, hi] of ranges) {
      expect(articles[0].source).toContain(`約 ${lo}〜${hi}%`);
      expect(articles[1].source).toContain(`about ${lo}–${hi}%`);
    }

    const ratio = (model: string, k: number) => FIGURE3_READINGS[model][k] / FIGURE3_READINGS[model][12];
    const lift = (model: string, k: number) =>
      (FIGURE3_READINGS[model][k] - FIGURE3_READINGS[model][0]) / (FIGURE3_READINGS[model][12] - FIGURE3_READINGS[model][0]);
    const pct = (x: number) => Math.round(x * 100);
    expect([pct(ratio("model1", 3)), pct(ratio("model2", 4)), pct(ratio("model4", 4))]).toEqual([84, 77, 79]);
    expect([pct(lift("model1", 3)), pct(lift("model1", 4))]).toEqual([75, 82]);
    expect([pct(lift("model2", 3)), pct(lift("model4", 3)), pct(lift("model2", 4)), pct(lift("model4", 4))]).toEqual([56, 60, 66, 69]);
    expect(articles[0].source).toContain("約 77〜79%");
    expect(articles[1].source).toContain("~77–79%");
  });

  it("keeps the §7.2 priority table and the §7.16 checklist in sync", () => {
    const shapes = articles.map((article) => {
      const table = priorityTable(article.source);
      const items = checklist(article.source);
      expect(Object.keys(table), article.locale).toEqual(["7.3", "7.4", "7.5", "7.6", "7.7"]);
      expect(items.length, article.locale).toBeGreaterThan(20);
      expect(items.every((item) => item.hasRef), article.locale).toBe(true);
      for (const [section, row] of Object.entries(table)) {
        const refsOf = (required: boolean) =>
          sortedSet(items.filter((item) => item.required === required).flatMap((item) => item.refs[section] ?? []));
        expect(refsOf(true), `${article.locale} §${section} required`).toEqual(row.before);
        expect(refsOf(false), `${article.locale} §${section} optional`).toEqual(row.quarter);
      }
      return { table, items: items.map(({ required, refs }) => ({ required, refs })) };
    });
    expect(shapes[0]).toEqual(shapes[1]);
  });

  it("states statistics that match the helpers", () => {
    expect(signTestTwoSided(8, 8).toFixed(4)).toBe("0.0078");
    expect(signTestTwoSided(8, 7).toFixed(3)).toBe("0.070");
    const [mLo, mHi] = wilsonInterval(296, 300);
    const [eLo, eHi] = wilsonInterval(3, 100);
    const [sLo, sHi] = sdIntervalMultipliersDf2();
    const a8 = selfInclusionAgreement(0.8);
    const a9 = selfInclusionAgreement(0.9);
    const expected = [
      "0.0078",
      "0.070",
      (mLo * 100).toFixed(1),
      (mHi * 100).toFixed(1),
      (eLo * 100).toFixed(1),
      (eHi * 100).toFixed(1),
      String(requiredSampleSize(0.9, 0.05)),
      String(requiredSampleSize(0.9, 0.03)),
      sLo.toFixed(2),
      sHi.toFixed(2),
      a8.rater.toFixed(2),
      a8.outsider.toFixed(3),
      a9.rater.toFixed(2),
      a9.outsider.toFixed(3),
      (servedDefectRate(0.1, 0.9, 0.8) * 100).toFixed(1),
      Math.round(servedDefectRate(0.68, 0.9, 0.8) * 100).toString() + "%",
    ];
    expect(expected).toEqual([
      "0.0078", "0.070", "96.6", "99.5", "1.0", "8.5", "139", "385",
      "0.52", "6.28", "0.84", "0.738", "0.91", "0.878", "1.4", "21%",
    ]);
    for (const article of articles) {
      for (const value of expected) expect(article.source, `${article.locale} ${value}`).toContain(value);
    }
    expect(abSampleSizePerArm(0.5, 0.003) / 1e6).toBeCloseTo(1.74, 2);
    expect(abSampleSizePerArm(0.3, 0.003) / 1e6).toBeCloseTo(4.07, 2);
    expect(articles[0].source).toContain("174 万");
    expect(articles[0].source).toContain("407 万");
    expect(articles[1].source).toContain("1.74 million");
    expect(articles[1].source).toContain("4.07 million");
  });

  it("links only to existing posts in its own locale", () => {
    for (const article of articles) {
      const links = Array.from(article.source.matchAll(/\]\(\/(ja|en)\/blog\/([a-z0-9-]+)\)/g));
      expect(links.length, article.locale).toBeGreaterThan(0);
      for (const [, locale, target] of links) {
        expect(locale).toBe(article.locale);
        expect(existsSync(resolve(root, "content", "blog", locale, `${target}.mdx`)), target).toBe(true);
      }
    }
  });

  it.each(articles)("compiles as MDX: $locale", async (article) => {
    const compiled = await serialize(article.source, {
      parseFrontmatter: true,
      mdxOptions: { remarkPlugins: [remarkGfm, remarkMath] },
    });
    expect(compiled.compiledSource.length).toBeGreaterThan(1000);
    expect(compiled.frontmatter).toMatchObject({ title: expect.any(String), date: "2026-10-16" });
  });
});
