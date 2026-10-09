export type ArticleLocale = "ja" | "en";
export type Bilingual = Record<ArticleLocale, string>;

/* ──────────────────────────────────────────────────────────
 * Part 1 — "What do people mean by ontology?"
 * Four layers that the word "ontology" bundles together, and how
 * common artifacts cover them. Ratings are deliberately coarse.
 * ────────────────────────────────────────────────────────── */

export type LayerId = "vocabulary" | "structure" | "binding" | "operation";
export type Coverage = "full" | "partial" | "none";
export type Anchor = "physical" | "logical-table" | "concept";

export type Layer = {
  id: LayerId;
  label: Bilingual;
  question: Bilingual;
};

export const layers: Layer[] = [
  {
    id: "vocabulary",
    label: { ja: "語彙", en: "Vocabulary" },
    question: {
      ja: "その言葉は何を指すのか（名前・定義・同義語）",
      en: "What does the term refer to? (names, definitions, synonyms)",
    },
  },
  {
    id: "structure",
    label: { ja: "構造", en: "Structure" },
    question: {
      ja: "概念どうしはどう関係し、何をもって同一とみなすのか（型・is-a・関係・キー・制約）",
      en: "How do concepts relate, and what counts as the same thing? (types, is-a, relations, keys, constraints)",
    },
  },
  {
    id: "binding",
    label: { ja: "束縛", en: "Binding" },
    question: {
      ja: "その概念の実例はどのデータにあるのか（ソースへの対応付け）",
      en: "Where do instances of the concept live? (mapping to sources)",
    },
  },
  {
    id: "operation",
    label: { ja: "運用", en: "Operation" },
    question: {
      ja: "その意味を何に使うのか（指標・規則・アクション）",
      en: "What is the meaning used for? (metrics, rules, actions)",
    },
  },
];

export type Interpretation = {
  id: string;
  name: Bilingual;
  example: Bilingual;
  coverage: Record<LayerId, Coverage>;
  anchor: Anchor;
  spectrum: Bilingual;
  misses: Bilingual;
};

export const interpretations: Interpretation[] = [
  {
    id: "table-descriptions",
    name: {
      ja: "テーブル・列へのディスクリプション",
      en: "Descriptions on tables and columns",
    },
    example: {
      ja: "データカタログで列 CUST_KBN に「顧客区分（1: 法人、2: 個人）」と書く",
      en: "Writing “customer class (1: corporate, 2: individual)” on column CUST_KBN in a data catalogue",
    },
    coverage: { vocabulary: "partial", structure: "none", binding: "none", operation: "none" },
    anchor: "physical",
    spectrum: { ja: "用語・注釈", en: "Terms / annotations" },
    misses: {
      ja: "意味が物理構造に直付けされ、概念が独立して存在しない。別システムの似た列との対応も、同一性の基準も書けない。",
      en: "Meaning is pinned to physical structures; no concept exists on its own. It cannot state how a similar column elsewhere corresponds, nor what makes two records the same thing.",
    },
  },
  {
    id: "glossary",
    name: { ja: "ビジネス用語集", en: "Business glossary" },
    example: {
      ja: "「アクティブ顧客」の定義文・責任者・関連語を管理する",
      en: "Managing the definition, steward and related terms of “active customer”",
    },
    coverage: { vocabulary: "full", structure: "partial", binding: "partial", operation: "none" },
    anchor: "concept",
    spectrum: { ja: "用語集〜シソーラス", en: "Glossary to thesaurus" },
    misses: {
      ja: "概念は立つが、関係は「関連語」程度で型も基数もない。データとの対応はタグ付け止まりで、問い合わせには使えない。",
      en: "Concepts exist, but relations are mostly “related term” without types or cardinality. Links to data are tags, not something you can query through.",
    },
  },
  {
    id: "thesaurus",
    name: { ja: "シソーラス・タクソノミー（SKOS など）", en: "Thesaurus / taxonomy (e.g. SKOS)" },
    example: {
      ja: "「冷凍食品」は「食品」の下位語、「フローズン」は同義語",
      en: "“Frozen food” is narrower than “food”; “frozen goods” is a synonym",
    },
    coverage: { vocabulary: "full", structure: "partial", binding: "none", operation: "none" },
    anchor: "concept",
    spectrum: { ja: "シソーラス・非形式的な is-a", en: "Thesaurus / informal is-a" },
    misses: {
      ja: "broader / narrower は厳密な部分集合関係を約束しない。性質（プロパティ）も、データへの束縛もない。",
      en: "broader/narrower does not promise strict subsumption. There are no properties and no binding to data.",
    },
  },
  {
    id: "mapping",
    name: { ja: "データソース間の対応表", en: "Source-to-source mapping tables" },
    example: {
      ja: "CRM.account_id ↔ ERP.KUNNR の ID 対応表や、列どうしの対応一覧",
      en: "A crosswalk CRM.account_id ↔ ERP.KUNNR; a list of column-to-column correspondences",
    },
    coverage: { vocabulary: "none", structure: "partial", binding: "full", operation: "none" },
    anchor: "physical",
    spectrum: { ja: "（スペクトル外：束縛だけ）", en: "(Off the spectrum: binding only)" },
    misses: {
      ja: "物理スキーマどうしを直接つなぐため、共通の概念が立たない。ソースが n 個なら対応は最大 n(n−1)/2 組に増え、「同じ」なのか「重なる」だけなのかも書き分けにくい。",
      en: "It wires physical schemas directly, so no shared concept appears. With n sources you may need up to n(n−1)/2 pairwise maps, and “same” vs. “overlapping” is hard to express.",
    },
  },
  {
    id: "semantic-model",
    name: { ja: "Power BI セマンティックモデル", en: "Power BI semantic model" },
    example: {
      ja: "Sales テーブルと DAX メジャー [Total Revenue]、スタースキーマのリレーションシップ",
      en: "A Sales table, a DAX measure [Total Revenue], star-schema relationships",
    },
    coverage: { vocabulary: "partial", structure: "partial", binding: "full", operation: "partial" },
    anchor: "logical-table",
    spectrum: { ja: "フレーム（ただし is-a なし）", en: "Frames (without is-a)" },
    misses: {
      ja: "集計のための表中心のモデル。概念の継承も、ドメインをまたぐ同名異義の区別も主眼ではない。",
      en: "A table-centric model built for aggregation. Concept inheritance and cross-domain homonyms are not its focus.",
    },
  },
  {
    id: "knowledge-graph",
    name: { ja: "ナレッジグラフ（実例のグラフ）", en: "Knowledge graph (graph of instances)" },
    example: {
      ja: "「A 社 —発注→ 受注 123 —出荷→ 便 456」というノードとエッジ",
      en: "Nodes and edges such as “ACME —placed→ order 123 —shipped as→ shipment 456”",
    },
    coverage: { vocabulary: "partial", structure: "partial", binding: "full", operation: "partial" },
    anchor: "concept",
    spectrum: { ja: "形式的なインスタンス〜フレーム", en: "Formal instances to frames" },
    misses: {
      ja: "実例（ABox）が主役で、スキーマ（TBox）が薄いことも多い。慣用上、オントロジーと呼ぶのは主にその「型の側」だ。",
      en: "Instances (the ABox) take centre stage and the schema (the TBox) is often thin. In common usage, “ontology” mainly names the type side.",
    },
  },
  {
    id: "fabric-ontology",
    name: { ja: "Fabric IQ の Ontology", en: "Fabric IQ ontology" },
    example: {
      ja: "エンティティ型 Customer を ERP のテーブルに束縛して Order との関係・同義語・規則を付け、売上の指標はセマンティックモデルから取り込む",
      en: "Binding entity type Customer to an ERP table, attaching its relationship to Order, synonyms and rules, and bringing in revenue metrics from a semantic model",
    },
    coverage: { vocabulary: "full", structure: "partial", binding: "full", operation: "partial" },
    anchor: "concept",
    spectrum: { ja: "フレーム＋単一継承", en: "Frames + single inheritance" },
    misses: {
      ja: "型・関係・単一継承・キーまでで、OWL の制約（restriction）や推論はない。規則は自然言語で、オントロジー自身は実行しない。",
      en: "Types, relationships, single inheritance and keys, but no OWL restrictions or reasoning. Rules are natural language; the ontology itself does not execute them.",
    },
  },
  {
    id: "owl",
    name: { ja: "OWL オントロジー（形式オントロジー）", en: "OWL ontology (formal ontology)" },
    example: {
      ja: "「冷凍コンテナで運ばれる出荷は冷凍品の出荷である」を公理として書き、推論器に出荷を自動分類させる",
      en: "Stating “every shipment carried in a reefer container is a frozen shipment” as an axiom and letting a reasoner classify shipments",
    },
    coverage: { vocabulary: "full", structure: "full", binding: "none", operation: "none" },
    anchor: "concept",
    spectrum: { ja: "一般的な論理制約", en: "General logical constraints" },
    misses: {
      ja: "単体では業務データとつながっていない。使うには R2RML などの写像（OBDA）を別に用意する。開世界仮定なので、「温度記録が少なくとも 1 つある」と書いても記録の欠落は違反にならず、データの検査には SHACL が要る。",
      en: "On its own it is not connected to business data; using it over such data needs separate mappings (OBDA, e.g. R2RML). Under the open-world assumption, an axiom such as “has at least one temperature log” does not flag missing logs; validating data takes SHACL.",
    },
  },
  {
    id: "operational",
    name: { ja: "運用まで担うオントロジー（Palantir Foundry など）", en: "Operational ontology (Palantir Foundry style)" },
    example: {
      ja: "オブジェクト型・リンク型に加え、「出荷を保留する」アクション型でデータを書き戻す",
      en: "Object and link types plus an action type “hold shipment” that writes back to data",
    },
    coverage: { vocabulary: "full", structure: "partial", binding: "full", operation: "full" },
    anchor: "concept",
    spectrum: { ja: "フレーム＋振る舞い（スペクトルの外へ拡張）", en: "Frames + behaviour (extends beyond the spectrum)" },
    misses: {
      ja: "読むための層を超えて「書く」側まで持つ。そのぶん、権限・監査・業務プロセスとの統合が設計の中心になる。",
      en: "It goes beyond a read layer into writing. Permissions, audit and process integration therefore become central design concerns.",
    },
  },
];

export function coverageScore(interpretation: Interpretation): number {
  const value: Record<Coverage, number> = { full: 2, partial: 1, none: 0 };
  return layers.reduce((sum, layer) => sum + value[interpretation.coverage[layer.id]], 0);
}

/* ──────────────────────────────────────────────────────────
 * Part 2 — A "semantic view" across systems you cannot JOIN.
 * A small enterprise scenario modelled the way Fabric IQ ontology
 * does it: entity types bound to one static source each, relationships
 * bound by a shared column or a mapping table, time series bound by
 * a shared column, metrics owned by a semantic model.
 * ────────────────────────────────────────────────────────── */

export type Engine = "SQL" | "KQL" | "DAX";

export type SourceSystem = {
  id: "crm" | "erp" | "tms" | "iot" | "mdm" | "bi";
  name: Bilingual;
  owner: Bilingual;
  fabricItem: Bilingual;
  engine: Engine;
  tables: { id: string; columns: string[] }[];
};

export const sources: SourceSystem[] = [
  {
    id: "crm",
    name: { ja: "営業 CRM", en: "Sales CRM" },
    owner: { ja: "営業企画", en: "Sales operations" },
    fabricItem: { ja: "レイクハウス（ショートカット経由）", en: "Lakehouse (via shortcut)" },
    engine: "SQL",
    tables: [{ id: "crm.accounts", columns: ["account_id", "account_name", "segment"] }],
  },
  {
    id: "erp",
    name: { ja: "受注・請求 ERP", en: "Order-to-cash ERP" },
    owner: { ja: "経理・受注管理", en: "Finance & order management" },
    fabricItem: { ja: "レイクハウス（日次で取り込み）", en: "Lakehouse (loaded daily)" },
    engine: "SQL",
    tables: [
      { id: "erp.customers", columns: ["sold_to_code", "legal_name", "credit_limit_jpy"] },
      { id: "erp.sales_orders", columns: ["order_no", "sold_to_code", "amount_jpy", "order_date"] },
    ],
  },
  {
    id: "tms",
    name: { ja: "輸配送 TMS", en: "Transport TMS" },
    owner: { ja: "物流", en: "Logistics" },
    fabricItem: { ja: "レイクハウス", en: "Lakehouse" },
    engine: "SQL",
    tables: [
      {
        id: "tms.shipments",
        columns: ["shipment_id", "order_ref", "container_id", "departed_at", "arrived_at"],
      },
      { id: "tms.containers", columns: ["container_id", "device_id", "reefer_type"] },
    ],
  },
  {
    id: "iot",
    name: { ja: "冷凍コンテナの IoT", en: "Reefer IoT" },
    owner: { ja: "設備運用", en: "Equipment operations" },
    fabricItem: { ja: "イベントハウス", en: "Eventhouse" },
    engine: "KQL",
    tables: [{ id: "telemetry", columns: ["device_id", "ts", "temp_c"] }],
  },
  {
    id: "mdm",
    name: { ja: "顧客マスター管理", en: "Customer master data" },
    owner: { ja: "データ管理", en: "Data management" },
    fabricItem: { ja: "レイクハウス", en: "Lakehouse" },
    engine: "SQL",
    tables: [{ id: "mdm.customer_xref", columns: ["account_id", "sold_to_code"] }],
  },
  {
    id: "bi",
    name: { ja: "販売分析モデル", en: "Sales analytics model" },
    owner: { ja: "経営企画", en: "Corporate planning" },
    fabricItem: { ja: "セマンティックモデル", en: "Semantic model" },
    engine: "DAX",
    tables: [{ id: "[Total Order Amount]", columns: [] }],
  },
];

export type EntityTypeId = "Account" | "Customer" | "Order" | "Shipment" | "Container";

export type EntityType = {
  id: EntityTypeId;
  namespace: "sales" | "billing" | "logistics";
  label: Bilingual;
  description: Bilingual;
  synonyms: Bilingual;
  key: string;
  staticBinding: { source: SourceSystem["id"]; table: string };
  timeSeries?: { source: SourceSystem["id"]; table: string; joinColumn: string; property: string };
};

export const entityTypes: EntityType[] = [
  {
    id: "Account",
    namespace: "sales",
    label: { ja: "取引先", en: "Account" },
    description: {
      ja: "営業が追いかける企業単位。見込み客を含み、法人格とは一致しないことがある。",
      en: "The company-level unit sales pursues. Includes prospects and need not match a legal entity.",
    },
    synonyms: { ja: "アカウント、顧客（営業の用法）", en: "account, client, customer (sales usage)" },
    key: "account_id",
    staticBinding: { source: "crm", table: "crm.accounts" },
  },
  {
    id: "Customer",
    namespace: "billing",
    label: { ja: "得意先", en: "Customer (sold-to)" },
    description: {
      ja: "受注・請求・与信の単位となる法人。見込み客は含まない。",
      en: "The legal entity that orders are taken from, invoiced to and credit-checked. Excludes prospects.",
    },
    synonyms: { ja: "顧客、得意先、受注先", en: "customer, sold-to party" },
    key: "sold_to_code",
    staticBinding: { source: "erp", table: "erp.customers" },
  },
  {
    id: "Order",
    namespace: "billing",
    label: { ja: "受注", en: "Order" },
    description: {
      ja: "顧客から受けた販売注文。金額は税抜・円建て。",
      en: "A sales order received from a customer, in JPY excluding tax.",
    },
    synonyms: { ja: "受注、オーダー", en: "sales order" },
    key: "order_no",
    staticBinding: { source: "erp", table: "erp.sales_orders" },
  },
  {
    id: "Shipment",
    namespace: "logistics",
    label: { ja: "出荷", en: "Shipment" },
    description: {
      ja: "受注を満たすために出庫・輸送される 1 便。",
      en: "A consignment dispatched and transported to fulfil an order.",
    },
    synonyms: { ja: "出荷、便", en: "consignment" },
    key: "shipment_id",
    staticBinding: { source: "tms", table: "tms.shipments" },
  },
  {
    id: "Container",
    namespace: "logistics",
    label: { ja: "冷凍コンテナ", en: "Reefer container" },
    description: {
      ja: "温度管理された輸送容器。庫内温度を時系列で持つ。",
      en: "A temperature-controlled transport container with an in-box temperature time series.",
    },
    synonyms: { ja: "リーファー", en: "reefer" },
    key: "container_id",
    staticBinding: { source: "tms", table: "tms.containers" },
    timeSeries: { source: "iot", table: "telemetry", joinColumn: "device_id", property: "temp_c" },
  },
];

export type RelationshipId = "billedAs" | "places" | "fulfilledBy" | "carriedIn";

export type Relationship = {
  id: RelationshipId;
  from: EntityTypeId;
  to: EntityTypeId;
  label: Bilingual;
  binding:
    | { kind: "column"; fromColumn: string; toColumn: string; crossSystem: boolean }
    | { kind: "mapping-table"; table: string; source: SourceSystem["id"]; crossSystem: boolean };
};

export const relationships: Relationship[] = [
  {
    id: "billedAs",
    from: "Account",
    to: "Customer",
    label: { ja: "請求上は（billedAs）", en: "billedAs" },
    binding: { kind: "mapping-table", table: "mdm.customer_xref", source: "mdm", crossSystem: true },
  },
  {
    id: "places",
    from: "Customer",
    to: "Order",
    label: { ja: "発注する（places）", en: "places" },
    binding: {
      kind: "column",
      fromColumn: "erp.customers.sold_to_code",
      toColumn: "erp.sales_orders.sold_to_code",
      crossSystem: false,
    },
  },
  {
    id: "fulfilledBy",
    from: "Order",
    to: "Shipment",
    label: { ja: "出荷される（fulfilledBy）", en: "fulfilledBy" },
    binding: {
      kind: "column",
      fromColumn: "erp.sales_orders.order_no",
      toColumn: "tms.shipments.order_ref",
      crossSystem: true,
    },
  },
  {
    id: "carriedIn",
    from: "Shipment",
    to: "Container",
    label: { ja: "積載される（carriedIn）", en: "carriedIn" },
    binding: {
      kind: "column",
      fromColumn: "tms.shipments.container_id",
      toColumn: "tms.containers.container_id",
      crossSystem: false,
    },
  },
];

export const rule = {
  name: { ja: "温度逸脱（TemperatureExcursion）", en: "TemperatureExcursion" },
  definition: {
    ja: "冷凍コンテナの庫内温度が −15℃ を上回る状態が 30 分以上続いた場合、温度逸脱とみなす。",
    en: "A reefer container has a temperature excursion when its in-box temperature stays above −15 °C for 30 minutes or more.",
  },
  linkedTo: ["Container"] as EntityTypeId[],
};

export const metric = {
  name: { ja: "受注金額合計（[Total Order Amount]）", en: "[Total Order Amount]" },
  owner: "bi" as SourceSystem["id"],
  linkedTo: "Order" as EntityTypeId,
};

export const question: Bilingual = {
  ja: "先週、温度逸脱を起こした冷凍コンテナで運ばれた出荷があった顧客を、影響を受けた受注の金額が大きい順に挙げて。営業 CRM 上の取引先名も添えて。",
  en: "Which customers had shipments carried in reefer containers that had a temperature excursion last week? Rank them by the amount of the affected orders and include their account names from the sales CRM.",
};

export type TermResolution = {
  term: Bilingual;
  target:
    | { kind: "entity"; id: EntityTypeId }
    | { kind: "rule" }
    | { kind: "metric" }
    | { kind: "property"; entity: EntityTypeId; property: string };
};

export const termResolutions: TermResolution[] = [
  { term: { ja: "温度逸脱", en: "temperature excursion" }, target: { kind: "rule" } },
  { term: { ja: "冷凍コンテナ", en: "reefer containers" }, target: { kind: "entity", id: "Container" } },
  { term: { ja: "出荷", en: "shipments" }, target: { kind: "entity", id: "Shipment" } },
  { term: { ja: "顧客", en: "customers" }, target: { kind: "entity", id: "Customer" } },
  { term: { ja: "受注の金額", en: "amount of the affected orders" }, target: { kind: "metric" } },
  {
    term: { ja: "取引先名", en: "account names" },
    target: { kind: "property", entity: "Account", property: "account_name" },
  },
];

export type ScenarioOptions = {
  /** mdm.customer_xref exists and is bound as the mapping table of billedAs */
  hasCrosswalk: boolean;
  /** tms.shipments.order_ref uses the same format as erp.sales_orders.order_no */
  keysAligned: boolean;
};

export type LinkStatus = "ok" | "unbound" | "no-match";

export function relationshipStatus(id: RelationshipId, options: ScenarioOptions): LinkStatus {
  if (id === "billedAs" && !options.hasCrosswalk) return "unbound";
  if (id === "fulfilledBy" && !options.keysAligned) return "no-match";
  return "ok";
}

/** The path the competency question needs, from the excursion back to the sales account. */
export const questionPath: RelationshipId[] = ["carriedIn", "fulfilledBy", "places", "billedAs"];

export type AnswerRow = {
  customer: string;
  account: string | null;
  orderAmountJpy: number;
  shipments: string[];
};

const affectedRows: AnswerRow[] = [
  { customer: "Kita Foods K.K.", account: "Kita Group", orderAmountJpy: 18_400_000, shipments: ["SH-7781", "SH-7790"] },
  { customer: "Minato Retail Co.", account: "Minato Holdings", orderAmountJpy: 9_250_000, shipments: ["SH-7784"] },
  { customer: "Aozora Delica Ltd.", account: null, orderAmountJpy: 3_100_000, shipments: ["SH-7795"] },
];

/**
 * Evaluates the walkthrough's competency question under the given options.
 * The core path (Container → Shipment → Order → Customer) must be intact for any
 * answer to exist; the Account hop only enriches rows with the sales-side name.
 */
export function answer(options: ScenarioOptions): { rows: AnswerRow[]; broken: RelationshipId[] } {
  const broken = questionPath.filter((id) => relationshipStatus(id, options) !== "ok");
  const coreBroken = broken.filter((id) => id !== "billedAs");
  if (coreBroken.length > 0) return { rows: [], broken };
  const rows = [...affectedRows]
    .sort((a, b) => b.orderAmountJpy - a.orderAmountJpy)
    .map((row) => (options.hasCrosswalk ? row : { ...row, account: null }));
  return { rows, broken };
}

export function sourceOf(entity: EntityType): SourceSystem {
  const found = sources.find((s) => s.id === entity.staticBinding.source);
  if (!found) throw new Error(`Unknown source for ${entity.id}`);
  return found;
}

export function enginesInvolved(): Engine[] {
  const engines = new Set<Engine>();
  for (const entity of entityTypes) {
    engines.add(sourceOf(entity).engine);
    if (entity.timeSeries) {
      const ts = sources.find((s) => s.id === entity.timeSeries?.source);
      if (ts) engines.add(ts.engine);
    }
  }
  const metricSource = sources.find((s) => s.id === metric.owner);
  if (metricSource) engines.add(metricSource.engine);
  return [...engines].sort();
}
