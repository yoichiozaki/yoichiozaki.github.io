"use client";

import { useState } from "react";
import {
  answer,
  entityTypes,
  interpretations,
  layers,
  metric,
  question,
  relationshipStatus,
  relationships,
  rule,
  sourceOf,
  sources,
  termResolutions,
  type Anchor,
  type ArticleLocale,
  type Coverage,
  type EntityTypeId,
  type LinkStatus,
  type ScenarioOptions,
} from "@/lib/ontology-article";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { stepPlayerAriaLabels } from "./stepPlayerAriaLabels";
import { useStepPlayer } from "./useStepPlayer";

type Props = { locale?: string };

function toLocale(locale: string): ArticleLocale {
  return locale === "en" ? "en" : "ja";
}

const COVERAGE_STYLE: Record<Coverage, string> = {
  full: "border-emerald-600/50 bg-[#5db872]/20 text-emerald-800 dark:text-emerald-200",
  partial: "border-amber-600/50 bg-[#e8a55a]/20 text-amber-900 dark:text-amber-200",
  none: "border-border bg-transparent text-muted-foreground",
};

const COVERAGE_SYMBOL: Record<Coverage, string> = { full: "●", partial: "◐", none: "○" };

const COVERAGE_LABEL: Record<Coverage, Record<ArticleLocale, string>> = {
  full: { ja: "持つ", en: "Yes" },
  partial: { ja: "一部", en: "Partly" },
  none: { ja: "持たない", en: "No" },
};

const ANCHOR_LABEL: Record<Anchor, Record<ArticleLocale, string>> = {
  physical: { ja: "物理構造（表・列）に直付け", en: "Pinned to physical structures (tables, columns)" },
  "logical-table": { ja: "論理的な表（分析用モデルの表）", en: "Logical tables (tables of an analytic model)" },
  concept: { ja: "概念（物理から独立）", en: "Concepts (independent of physical storage)" },
};

const buttonBase =
  "rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/* ──────────────────────────────────────────────────────────
 * 1. OntologyInterpretationMap
 * ────────────────────────────────────────────────────────── */

export function OntologyInterpretationMap({ locale = "ja" }: Props) {
  const lang = toLocale(locale);
  const isJa = lang === "ja";
  const [selectedId, setSelectedId] = useState("fabric-ontology");
  const selected = interpretations.find((i) => i.id === selectedId) ?? interpretations[0];

  return (
    <InteractiveDemo
      title={isJa ? "「オントロジー」と呼ばれるものを 4 つの層で比べる" : "Comparing things called “ontology” across four layers"}
      description={
        isJa
          ? "行を選ぶと、その成果物が何を持ち、何を持たないかを表示します。●＝持つ、◐＝一部、○＝持たない。評価は議論のための粗い目安です。"
          : "Select a row to see what each artefact has and lacks. ● = yes, ◐ = partly, ○ = no. The ratings are coarse, meant to support the discussion."
      }
    >
      <div className="space-y-4">
        <div
          role="region"
          aria-label={isJa ? "成果物と層の対応表" : "Artefacts by layer"}
          tabIndex={0}
          className="overflow-x-auto rounded-lg border border-border bg-background focus-visible:outline-2 focus-visible:outline-accent"
        >
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="px-3 py-2 font-semibold">
                  {isJa ? "成果物" : "Artefact"}
                </th>
                {layers.map((layer) => (
                  <th key={layer.id} scope="col" className="px-2 py-2 text-center font-semibold">
                    {layer.label[lang]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interpretations.map((item) => {
                const active = item.id === selected.id;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border/60 last:border-b-0 ${active ? "bg-accent/10" : ""}`}
                  >
                    <th scope="row" className="px-2 py-1.5 text-left font-normal">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full rounded px-1.5 py-1 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent ${
                          active ? "font-semibold text-foreground" : "text-foreground"
                        }`}
                      >
                        {item.name[lang]}
                      </button>
                    </th>
                    {layers.map((layer) => {
                      const coverage = item.coverage[layer.id];
                      return (
                        <td key={layer.id} className="px-2 py-1.5 text-center">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm ${COVERAGE_STYLE[coverage]}`}
                            title={COVERAGE_LABEL[coverage][lang]}
                          >
                            <span aria-hidden="true">{COVERAGE_SYMBOL[coverage]}</span>
                            <span className="sr-only">{COVERAGE_LABEL[coverage][lang]}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-background p-4" aria-live="polite">
          <p className="text-base font-semibold text-foreground">{selected.name[lang]}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold">{isJa ? "例: " : "Example: "}</span>
            {selected.example[lang]}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {layers.map((layer) => {
              const coverage = selected.coverage[layer.id];
              return (
                <li key={layer.id} className={`rounded-lg border p-2.5 ${COVERAGE_STYLE[coverage]}`}>
                  <p className="text-sm font-semibold">
                    <span aria-hidden="true">{COVERAGE_SYMBOL[coverage]} </span>
                    {layer.label[lang]} — {COVERAGE_LABEL[coverage][lang]}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-90">{layer.question[lang]}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold text-foreground">{isJa ? "意味の付け先" : "Meaning attached to"}</dt>
            <dd className="text-muted-foreground">{ANCHOR_LABEL[selected.anchor][lang]}</dd>
            <dt className="font-semibold text-foreground">
              {isJa ? "スペクトル上のおおよその位置" : "Rough position on the spectrum"}
            </dt>
            <dd className="text-muted-foreground">{selected.spectrum[lang]}</dd>
            <dt className="font-semibold text-foreground">{isJa ? "足りないもの" : "What it lacks"}</dt>
            <dd className="text-muted-foreground">{selected.misses[lang]}</dd>
          </dl>
        </div>
      </div>
    </InteractiveDemo>
  );
}

/* ──────────────────────────────────────────────────────────
 * 2. SemanticViewWalkthrough
 * ────────────────────────────────────────────────────────── */

type Step = { title: Record<ArticleLocale, string>; body: Record<ArticleLocale, string> };

const STEPS: Step[] = [
  {
    title: { ja: "問いは業務の言葉で届く", en: "The question arrives in business language" },
    body: {
      ja: "どのシステムのどの表を見ればよいかは、問いのどこにも書かれていない。この問いは、オントロジー工学でいう能力質問（competency question）——このオントロジーが答えられなければならない問い——の例でもある。",
      en: "Nothing in the question says which system or table to look at. It is also an example of what ontology engineering calls a competency question: a question the ontology must be able to answer.",
    },
  },
  {
    title: { ja: "語を概念に解決する", en: "Resolve words to concepts" },
    body: {
      ja: "「顧客」は営業の取引先（sales:Account）にも、受注・請求の得意先（billing:Customer）にも当たりうる。受注の金額を問うている以上、ここでは billing:Customer だ。名前空間・説明文・同義語が、この曖昧さを解く材料になる。「温度逸脱」は自然言語の規則に、「受注の金額」はセマンティックモデルが所有する指標に解決される。",
      en: "“Customers” could mean the sales account (sales:Account) or the order-to-cash sold-to party (billing:Customer). Because the question asks about order amounts, it is billing:Customer here. Namespaces, descriptions and synonyms are what make this disambiguation possible. “Temperature excursion” resolves to a natural-language rule, and the order amount to a metric owned by a semantic model.",
    },
  },
  {
    title: { ja: "概念のあいだの経路を決める", en: "Plan a path between concepts" },
    body: {
      ja: "Container ← carriedIn ← Shipment ← fulfilledBy ← Order ← places ← Customer、取引先名のためにさらに Customer ← billedAs ← Account。ここまで、データは 1 行も読んでいない。意味の地図の上で計画を立てているだけだ。",
      en: "Container ← carriedIn ← Shipment ← fulfilledBy ← Order ← places ← Customer, plus Customer ← billedAs ← Account for the account name. No data has been read yet; this is planning on a map of meaning.",
    },
  },
  {
    title: { ja: "経路を束縛に展開する", en: "Expand the path into bindings" },
    body: {
      ja: "各エンティティ型を、それを所有するシステムの表へ展開する。Fabric では 1 つのエンティティ型が持てる静的な束縛は 1 つまでなので、CRM の取引先と ERP の得意先を 1 つの型に合流させず、別の型として関係で結んでいる。Container は TMS の静的データに加えて、IoT の時系列を device_id で束縛している。",
      en: "Each entity type expands to a table in the system that owns it. In Fabric an entity type can have only one static binding, so the CRM account and the ERP sold-to party are not merged into one type; they are separate types joined by a relationship. Container combines static TMS data with an IoT time series bound through device_id.",
    },
  },
  {
    title: { ja: "関係を結合キーに展開する", en: "Expand relationships into join keys" },
    body: {
      ja: "同じシステムの中の関係（places と carriedIn）は素直だ。境界をまたぐ関係は違う。fulfilledBy は ERP の order_no と TMS の order_ref の値が一致して初めて成り立ち、billedAs は MDM が作る対応表がなければ実例を持てない。オントロジーは関係の意味を宣言できるが、突き合わせのキーそのものは作らない。",
      en: "Relationships inside one system (places, carriedIn) are straightforward. Cross-boundary ones are not: fulfilledBy holds only if ERP’s order_no and TMS’s order_ref actually match, and billedAs has no instances without the crosswalk that MDM produces. The ontology can declare what a relationship means; it does not invent the keys that realise it.",
    },
  },
  {
    title: { ja: "エンジンごとに実行する", en: "Execute per engine" },
    body: {
      ja: "オントロジー自体は問い合わせエンジンではない。消費側のエージェントが束縛先に応じて KQL・SQL・DAX を選び、結果を組み合わせる。温度逸脱の規則をクエリに翻訳するのもエージェントの仕事で、どう解釈したかは生成されたクエリで確かめたい（執筆時点では、組み込みのオントロジーエージェントが回答時に規則を考慮しないという既知の問題があり、規則を効かせるには、MCP の list_ontology_rules などで規則を取り出して使う消費者が要る）。",
      en: "The ontology is not a query engine. The consuming agent picks KQL, SQL or DAX according to each binding and combines the results. Translating the excursion rule into a query is also the agent’s job, so check the generated queries to see how it interpreted the rule (at the time of writing, a known issue means the built-in ontology agent does not consider rules when answering; to apply them, you need a consumer that fetches rules itself, e.g. through the MCP list_ontology_rules tool).",
    },
  },
  {
    title: { ja: "答えと出所", en: "The answer and its provenance" },
    body: {
      ja: "得意先名は ERP、取引先名は CRM（MDM の対応表経由）、金額はセマンティックモデルの指標、逸脱は IoT から来ている。利用者が表と結合を知らなくても、意味の上では出所を追える。",
      en: "Customer names come from ERP, account names from CRM via the MDM crosswalk, amounts from the semantic model’s metric, and excursions from IoT. Users can trace provenance in terms of meaning without knowing the tables or joins.",
    },
  },
];

const ENTITY_ORDER: EntityTypeId[] = ["Account", "Customer", "Order", "Shipment", "Container"];

const NAMESPACE_STYLE: Record<string, string> = {
  sales: "border-sky-600/50 bg-[#5db8a6]/10",
  billing: "border-amber-600/50 bg-[#e8a55a]/10",
  logistics: "border-emerald-600/50 bg-[#5db872]/10",
};

const STATUS_STYLE: Record<LinkStatus, string> = {
  ok: "border-emerald-600/50 bg-[#5db872]/15 text-emerald-800 dark:text-emerald-200",
  unbound: "border-red-600/50 bg-[#c64545]/10 text-red-700 dark:text-red-300",
  "no-match": "border-red-600/50 bg-[#c64545]/10 text-red-700 dark:text-red-300",
};

const STATUS_LABEL: Record<LinkStatus, Record<ArticleLocale, string>> = {
  ok: { ja: "実例あり", en: "has instances" },
  unbound: { ja: "未束縛（対応表なし）", en: "unbound (no crosswalk)" },
  "no-match": { ja: "1 件も一致しない", en: "no values match" },
};

function sqlView(lang: ArticleLocale): string {
  const c =
    lang === "ja"
      ? {
          head: "-- もし全部が 1 つの DB にあり、1 つのチームが所有していたら",
          rule: "-- 規則「温度逸脱」を SQL に翻訳した部分（30 分継続の判定は省略）",
          week: "-- 「先週」は直近 7 日に簡略化",
        }
      : {
          head: "-- If everything lived in one database owned by one team",
          rule: '-- rule "TemperatureExcursion" translated into SQL (30-minute duration check omitted)',
          week: '-- "last week" simplified to the past 7 days',
        };
  return `${c.head}
CREATE VIEW affected_customers AS
WITH excursions AS (
  ${c.rule}
  SELECT device_id, ts
  FROM telemetry
  WHERE temp_c > -15
    AND ts >= CURRENT_TIMESTAMP - INTERVAL '7' DAY  ${c.week}
),
affected_orders AS (
  SELECT DISTINCT o.order_no, o.sold_to_code, o.amount_jpy
  FROM excursions e
  JOIN containers   k ON k.device_id    = e.device_id
  JOIN shipments    s ON s.container_id = k.container_id
                     AND e.ts BETWEEN s.departed_at AND s.arrived_at
  JOIN sales_orders o ON o.order_no     = s.order_ref
)
SELECT c.legal_name,
       a.account_name,
       SUM(ao.amount_jpy) AS order_amount_jpy
FROM affected_orders ao
JOIN customers c          ON c.sold_to_code = ao.sold_to_code
LEFT JOIN customer_xref x ON x.sold_to_code = c.sold_to_code
LEFT JOIN accounts a      ON a.account_id   = x.account_id
GROUP BY c.legal_name, a.account_name
ORDER BY order_amount_jpy DESC;`;
}

function formatJpy(value: number, lang: ArticleLocale): string {
  return lang === "ja"
    ? `${value.toLocaleString("ja-JP")} 円`
    : `JPY ${value.toLocaleString("en-US")}`;
}

export function SemanticViewWalkthrough({ locale = "ja" }: Props) {
  const lang = toLocale(locale);
  const isJa = lang === "ja";
  const [options, setOptions] = useState<ScenarioOptions>({ hasCrosswalk: true, keysAligned: true });
  const [showSql, setShowSql] = useState(false);
  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 2600 });
  const step = player.step;
  const result = answer(options);
  const info = STEPS[step];
  const body =
    step === STEPS.length - 1 && result.rows.length === 0
      ? isJa
        ? "経路が途中で切れていると、出所をたどる以前に、答えそのものが出てこない。オントロジーの定義を直しても解決せず、直すべきはデータの側だ。"
        : "When the path breaks midway, there is no answer to trace provenance for. Fixing the ontology’s definitions will not help; the data side is what needs fixing."
      : info.body[lang];

  const relationshipBetween = (left: EntityTypeId, right: EntityTypeId) =>
    relationships.find(
      (r) => (r.from === left && r.to === right) || (r.from === right && r.to === left),
    );

  const dynamicNotes: string[] = [];
  if (step >= 4 && !options.hasCrosswalk) {
    dynamicNotes.push(
      isJa
        ? "対応表がないため billedAs は未束縛。型としては存在するが、実例を 1 つも持たない。"
        : "Without the crosswalk, billedAs is unbound: it exists as a type but has no instances.",
    );
  }
  if (step >= 4 && !options.keysAligned) {
    dynamicNotes.push(
      isJa
        ? "order_ref が「SO-000123」、order_no が「123」のように表記が違うと、等値の結合は 1 件も一致しない。上流で正規化したビューを作り、そちらを束縛し直す必要がある。"
        : "If order_ref looks like “SO-000123” while order_no is “123”, an equality join matches nothing. You need a normalised view upstream and must bind to that instead.",
    );
  }
  if (step >= 6 && result.rows.length > 0) {
    dynamicNotes.push(
      options.hasCrosswalk
        ? isJa
          ? "Aozora Delica は対応表に載っていない（CRM に取引先がない）ため、取引先名は空のまま。CRM の取引先と ERP の得意先は「同じ集合」ではなく「重なる集合」なので、ここは内部結合ではなく外部結合の意味になる。"
          : "Aozora Delica is not in the crosswalk (it has no CRM account), so its account name stays empty. CRM accounts and ERP sold-to parties are overlapping sets, not the same set, so this hop has outer-join semantics rather than inner-join semantics."
        : isJa
          ? "対応表がないので取引先名はすべて空だが、得意先と金額は出る。取引先への経路は答えを補う情報で、問いの中核の経路（Container → Shipment → Order → Customer）は切れていないからだ。"
          : "Without the crosswalk every account name is empty, but customers and amounts still come back: the hop to Account only enriches the answer, and the core path (Container → Shipment → Order → Customer) is intact.",
    );
  }

  const toggle = (key: keyof ScenarioOptions) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <InteractiveDemo
      title={isJa ? "JOIN を書けない場所の「意味論的ビュー」を歩く" : "Walking a “semantic view” where you cannot write the JOIN"}
      description={
        isJa
          ? "5 つのシステムとセマンティックモデルにまたがる問いを、オントロジーとそれを読むエージェントが、語→概念→経路→束縛→結合キー→実行へと展開する様子を追います。2 つのスイッチで、どこが壊れるかを確かめてください。架空のシナリオです。"
          : "Follow how an ontology, and the agent that reads it, expand a question spanning five systems and a semantic model: words → concepts → path → bindings → join keys → execution. Use the two switches to see what breaks. The scenario is fictional."
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-background p-3">
          <legend className="px-1 text-xs font-semibold text-muted-foreground">
            {isJa ? "前提を変える" : "Change the assumptions"}
          </legend>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={options.hasCrosswalk} onChange={() => toggle("hasCrosswalk")} />
            {isJa ? "MDM の対応表 mdm.customer_xref がある" : "The MDM crosswalk mdm.customer_xref exists"}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={options.keysAligned} onChange={() => toggle("keysAligned")} />
            {isJa ? "order_ref と order_no の表記が揃っている" : "order_ref and order_no use the same format"}
          </label>
          <button
            type="button"
            aria-pressed={showSql}
            onClick={() => setShowSql((v) => !v)}
            className={`${buttonBase} ${showSql ? "border-accent bg-accent/10 font-semibold text-foreground" : "border-border text-foreground hover:bg-muted"}`}
          >
            {isJa ? "単一 DB の SQL ビューと比べる" : "Compare with a single-database SQL view"}
          </button>
        </fieldset>

        {/* Question */}
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isJa ? "問い" : "Question"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{question[lang]}</p>
          {step >= 1 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {termResolutions.map((resolution) => {
                const target = resolution.target;
                let resolved = "";
                if (target.kind === "entity") {
                  const entity = entityTypes.find((e) => e.id === target.id);
                  resolved = entity ? `${entity.namespace}:${entity.id}` : target.id;
                } else if (target.kind === "rule") {
                  resolved = isJa ? `規則 ${rule.name.en}` : `rule ${rule.name.en}`;
                } else if (target.kind === "metric") {
                  resolved = isJa ? `指標 ${metric.name.en}` : `metric ${metric.name.en}`;
                } else {
                  const entity = entityTypes.find((e) => e.id === target.entity);
                  resolved = entity ? `${entity.namespace}:${entity.id}.${target.property}` : target.property;
                }
                return (
                  <li
                    key={resolution.term.en}
                    className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-foreground"
                  >
                    {resolution.term[lang]} → {resolved}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Ontology lane */}
        <div
          role="region"
          aria-label={isJa ? "オントロジーの経路" : "Ontology path"}
          tabIndex={0}
          className="overflow-x-auto rounded-lg border border-border bg-background p-3 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isJa ? "オントロジー（意味の地図）" : "Ontology (map of meaning)"}
          </p>
          {step < 2 ? (
            <p className="text-sm text-muted-foreground">
              {isJa ? "（ステップ 3 で経路が現れます）" : "(The path appears at step 3.)"}
            </p>
          ) : (
            <div className="flex min-w-[52rem] items-stretch">
              {ENTITY_ORDER.map((id, index) => {
                const entity = entityTypes.find((e) => e.id === id);
                if (!entity) return null;
                const source = sourceOf(entity);
                const next = ENTITY_ORDER[index + 1];
                const rel = next ? relationshipBetween(id, next) : undefined;
                const status = rel ? relationshipStatus(rel.id, options) : "ok";
                const tsSource = entity.timeSeries
                  ? sources.find((s) => s.id === entity.timeSeries?.source)
                  : undefined;
                return (
                  <div key={id} className="flex items-stretch">
                    <div className={`w-40 shrink-0 rounded-lg border p-2 ${NAMESPACE_STYLE[entity.namespace]}`}>
                      <p className="font-mono text-[10px] text-muted-foreground">{entity.namespace}:</p>
                      <p className="text-sm font-semibold text-foreground">{entity.id}</p>
                      <p className="text-[11px] text-muted-foreground">{entity.label[lang]}</p>
                      {step >= 3 && (
                        <div className="mt-1.5 space-y-0.5 border-t border-border/60 pt-1.5 font-mono text-[10px] leading-snug text-foreground">
                          <p>
                            {entity.staticBinding.table}
                          </p>
                          <p className="text-muted-foreground">
                            {source.name[lang]} · {source.engine}
                          </p>
                          <p className="text-muted-foreground">{source.fabricItem[lang]}</p>
                          {entity.timeSeries && tsSource && (
                            <p className="text-muted-foreground">
                              + {entity.timeSeries.table}.{entity.timeSeries.property} ({tsSource.engine})
                            </p>
                          )}
                        </div>
                      )}
                      {step >= 1 && rule.linkedTo.includes(id) && (
                        <p className="mt-1 rounded bg-[#c64545]/10 px-1 py-0.5 text-[10px] text-red-700 dark:text-red-300">
                          {isJa ? "規則: " : "rule: "}
                          {rule.name.en}
                        </p>
                      )}
                      {step >= 1 && metric.linkedTo === id && (
                        <p className="mt-1 rounded bg-accent/10 px-1 py-0.5 text-[10px] text-foreground">
                          {isJa ? "指標: " : "metric: "}
                          {metric.name.en}
                        </p>
                      )}
                    </div>
                    {rel && (
                      <div className="flex w-36 shrink-0 flex-col items-center justify-center px-1 text-center">
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {rel.from === id ? `${rel.id} →` : `← ${rel.id}`}
                        </p>
                        <div className="my-1 h-px w-full bg-border" aria-hidden="true" />
                        {step >= 4 && (
                          <div className={`w-full rounded border px-1 py-0.5 text-[10px] leading-snug ${STATUS_STYLE[status]}`}>
                            <p className="font-mono">
                              {rel.binding.kind === "mapping-table"
                                ? `via ${rel.binding.table}`
                                : `${rel.binding.fromColumn.split(".").slice(-1)[0]} = ${rel.binding.toColumn.split(".").slice(-1)[0]}`}
                            </p>
                            <p>
                              {rel.binding.crossSystem
                                ? isJa
                                  ? "境界をまたぐ"
                                  : "crosses a boundary"
                                : isJa
                                  ? "同一システム内"
                                  : "within one system"}
                              {" · "}
                              {STATUS_LABEL[status][lang]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Execution */}
        {step >= 5 && (
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "実行（消費側のエージェントが行う）" : "Execution (done by the consuming agent)"}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              <li>
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">KQL</span>
                {isJa
                  ? "イベントハウスの telemetry から、規則に当たる device_id と時刻を求める"
                  : "Find the device_ids and times that match the rule in the eventhouse telemetry table"}
              </li>
              <li>
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">SQL</span>
                {isJa
                  ? "レイクハウスの表で containers → shipments → sales_orders → customers（→ customer_xref → accounts）をたどる"
                  : "Walk containers → shipments → sales_orders → customers (→ customer_xref → accounts) over the lakehouse tables"}
              </li>
              <li>
                <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">DAX</span>
                {isJa
                  ? "影響を受けた受注について [Total Order Amount] を得意先別に評価する"
                  : "Evaluate [Total Order Amount] per customer for the affected orders"}
              </li>
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {isJa
                ? "経路そのものが主役の問いなら、グラフを実体化して GQL でたどる選択肢もある（エンティティ型キーが必須で、対象はレイクハウスかミラーリングされたデータベースの Delta テーブルに束縛された型だけ。複数の表に束縛された型も外れるので、このデモでは時系列を併せ持つ Container が対象にならない）。分解と結合の具体的なやり方は消費側の実装に依存する。"
                : "When the path itself is the point, you can materialise a graph and traverse it with GQL (entity type keys are required, only types bound to Delta tables in lakehouses or mirrored databases are eligible, and types bound to multiple tables are excluded — so in this demo Container, with its time series, drops out). Exactly how the work is decomposed and recombined depends on the consumer."}
            </p>
          </div>
        )}

        {/* Answer */}
        {step >= 6 && (
          <div className="rounded-lg border border-border bg-background p-3" aria-live="polite">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "答え" : "Answer"}
            </p>
            {result.rows.length === 0 ? (
              <p className="mt-2 rounded border border-red-600/50 bg-[#c64545]/10 p-2 text-sm text-red-700 dark:text-red-300">
                {isJa
                  ? "経路の途中（fulfilledBy）が切れているため、答えは 0 行。オントロジーの定義は正しくても、束縛先のデータで関係が成り立たなければ答えは出ない。"
                  : "The path is broken at fulfilledBy, so the answer has zero rows. The ontology definition can be right and still produce nothing if the bound data does not realise the relationship."}
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-2 py-1">{isJa ? "得意先（ERP）" : "Customer (ERP)"}</th>
                      <th scope="col" className="px-2 py-1">{isJa ? "取引先（CRM）" : "Account (CRM)"}</th>
                      <th scope="col" className="px-2 py-1 text-right">{isJa ? "受注金額（指標）" : "Order amount (metric)"}</th>
                      <th scope="col" className="px-2 py-1">{isJa ? "出荷（TMS）" : "Shipments (TMS)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.customer} className="border-b border-border/60 last:border-b-0">
                        <td className="px-2 py-1 text-foreground">{row.customer}</td>
                        <td className="px-2 py-1 text-foreground">{row.account ?? "—"}</td>
                        <td className="px-2 py-1 text-right font-mono text-foreground">{formatJpy(row.orderAmountJpy, lang)}</td>
                        <td className="px-2 py-1 font-mono text-xs text-muted-foreground">{row.shipments.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Narration */}
        <div className="rounded-lg border border-border bg-background p-3" aria-live="polite">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[11px] text-accent">
              {String(step + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold text-foreground">{info.title[lang]}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          {dynamicNotes.map((note) => (
            <p key={note} className="mt-2 rounded border border-amber-600/40 bg-[#e8a55a]/10 p-2 text-sm text-amber-900 dark:text-amber-200">
              {note}
            </p>
          ))}
        </div>

        {showSql && (
          <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
            <pre
              tabIndex={0}
              aria-label={isJa ? "単一 DB で書く場合の SQL ビュー" : "SQL view in a single database"}
              className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus-visible:outline-2 focus-visible:outline-accent"
            >
              <code>{sqlView(lang)}</code>
            </pre>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p className="font-semibold text-foreground">
                {isJa ? "ビューに書けること" : "What the view can say"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {isJa
                  ? "FROM と JOIN が束縛と関係に、excursions の CTE とその WHERE が規則の翻訳に対応する。つまり「どう計算するか」。"
                  : "FROM and JOIN correspond to bindings and relationships; the excursions CTE and its WHERE clause to the translated rule. In short: how to compute it."}
              </p>
              <p className="mt-3 font-semibold text-foreground">
                {isJa ? "ビューに現れないこと" : "What never appears in the view"}
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>{isJa ? "「顧客」が sales:Account ではなく billing:Customer を指すという判断" : "The decision that “customer” means billing:Customer, not sales:Account"}</li>
                <li>{isJa ? "温度逸脱の定義文そのものと、その出所" : "The excursion rule’s wording and where it comes from"}</li>
                <li>{isJa ? "受注金額の計算を所有しているのはセマンティックモデルだという事実" : "That the semantic model owns the order-amount calculation"}</li>
                <li>{isJa ? "order_ref と order_no が同じものを指すという主張と、その根拠" : "The claim that order_ref and order_no denote the same thing, and its basis"}</li>
                <li>{isJa ? "CRM と ERP の顧客集合は重なるだけだという知識（だから LEFT JOIN）" : "The knowledge that CRM and ERP customer sets only overlap (hence the LEFT JOIN)"}</li>
              </ul>
            </div>
          </div>
        )}

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(s) => STEPS[s].title[lang]}
        />
      </div>
    </InteractiveDemo>
  );
}
