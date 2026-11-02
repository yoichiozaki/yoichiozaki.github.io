import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEVER_RANGE, PRESET_2023, PRESET_2026, evaluate, type LeverKey, type Levers } from "./capability-levers";

const root = resolve(__dirname, "..", "..");
const slug = "ai-industry-capital-to-fcf";
const articles = ["ja", "en"].map((locale) => ({
  locale,
  source: readFileSync(resolve(root, "content", "blog", locale, `${slug}.mdx`), "utf8"),
}));

const at = (overrides: Partial<Levers>, from: Levers = PRESET_2023) => evaluate({ ...from, ...overrides });

function firstWhere(from: Levers, key: LeverKey, pred: (l: Levers) => boolean): number {
  const { min, max } = LEVER_RANGE[key];
  for (let x = min; x <= max + 1e-9; x += 0.01) {
    if (pred({ ...from, [key]: x })) return x;
  }
  return Infinity;
}

describe("ai-industry-capital-to-fcf: capability levers figure", () => {
  it.each(articles)("places the figure once, inside §5.2 ($locale)", ({ source }) => {
    expect(source.match(/<CapabilityLeversLab \/>/g)).toHaveLength(1);
    const figure = source.indexOf("<CapabilityLeversLab />");
    expect(figure).toBeGreaterThan(source.indexOf("\n### 5.2 "));
    expect(figure).toBeLessThan(source.indexOf("\n### 5.3 "));
  });

  it("is registered as an MDX component", () => {
    const page = readFileSync(resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"), "utf8");
    expect(page).toContain("CapabilityLeversLab: () => <CapabilityLeversLab locale={locale} />");
  });

  it("matches the prose: pulling only pretraining widens the band until power and data bind", () => {
    for (const from of [PRESET_2023, PRESET_2026]) {
      const power = firstWhere(from, "pretrain", (l) => evaluate(l).status.power === "limit");
      const data = firstWhere(from, "pretrain", (l) => evaluate(l).status.data === "limit");
      expect(power).toBeLessThanOrEqual(LEVER_RANGE.pretrain.max);
      expect(data).toBeLessThanOrEqual(LEVER_RANGE.pretrain.max);
      const bands = [0, 1, 2, 3, 4].map((p) => evaluate({ ...from, pretrain: p }).hardBand);
      for (let i = 1; i < bands.length; i++) expect(bands[i]).toBeGreaterThan(bands[i - 1]);
    }
    // From the 2023 position, power and data bind before HBM does.
    const hbm = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.hbm === "limit");
    const power = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.power === "limit");
    const data = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.data === "limit");
    expect(Math.max(power, data)).toBeLessThan(hbm);
  });

  it("matches the prose: inference-time compute pays off most together with RL, at a cost", () => {
    const alone = at({ inference: 3 }).verifiable - evaluate(PRESET_2023).verifiable;
    const withRl = at({ rl: 4, inference: 3 }).verifiable - at({ rl: 4 }).verifiable;
    expect(withRl).toBeGreaterThan(2 * alone);
    const pulled = at({ inference: 3 }, PRESET_2026);
    expect(pulled.inferenceCostPerTask).toBeGreaterThan(evaluate(PRESET_2026).inferenceCostPerTask * 5);
    expect(pulled.status.hbm).toBe("limit");
  });

  it("matches the prose: RL stops helping near its ceiling, and widening the range raises it", () => {
    const rlTop = at({ rl: LEVER_RANGE.rl.max }, PRESET_2026);
    expect(rlTop.status.rl).toBe("limit");
    expect(rlTop.verifiable - evaluate(PRESET_2026).verifiable).toBeLessThan(2);
    const narrow = at({ rl: 4, coverage: 0.1 });
    const wide = at({ rl: 4, coverage: 1 });
    expect(wide.verifiable).toBeGreaterThan(narrow.verifiable + 15);
  });
});
