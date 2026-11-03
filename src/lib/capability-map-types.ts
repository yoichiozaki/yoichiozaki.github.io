/**
 * Types and builders for the "levers of AI capability" map used in
 * content/blog/{ja,en}/ai-industry-capital-to-fcf.mdx (§5.2).
 *
 * The map lays the article's chain from capital to FCF (§2.1) over the levers
 * that raise capability. The money links run along the top; links 2–6 are
 * opened up below into resources, compute, training and inference, the model,
 * the harness and the uses. The map separates what a model can do on its own
 * ("model capability") from what a whole system gets done ("completing the
 * work"); the harness sits between them, and the context layer (Microsoft's
 * "IQ") feeds the system what the model never learned. Labels on capability
 * arrows name the efficiency (or, for context, the precision) that converts one
 * thing into the next, labels on money arrows the cost deducted, and dashed
 * loops show how results flow back upstream.
 */

export type Locale = "ja" | "en";
export type Text = { ja: string; en: string };

export type Category =
  | "money"
  | "resource"
  | "compute"
  | "size"
  | "stage"
  | "material"
  | "harness"
  | "context"
  | "capability"
  | "measure";

/** What a source is, shown as a small badge next to the link. */
export type LinkKind = "paper" | "news" | "filing" | "official" | "data" | "post";

/**
 * A source or related reading. `slug` links to another post on this blog;
 * `href` to an external source. `meta` carries the author or publisher and date.
 */
export type Link = { kind: LinkKind; ja: string; en: string; meta?: Text; href?: string; slug?: string };

export type Detail = {
  summary: Text;
  note?: Text;
  /**
   * Article sections this element draws on: "4.4" quotes the section's main
   * point, "4.6:tts" a specific one (see capability-map-sections.ts).
   */
  refs?: string[];
  links?: Link[];
};

export type ItemDef = { kind: "item"; id: string; label: Text; detail: Detail };
export type SubDef = { kind: "sub"; id: string; label: Text; detail: Detail; items: ItemDef[] };
export type GroupDef = {
  kind: "group";
  id: string;
  category: Category;
  label: Text;
  /** A short line under the header, such as the question a link of the chain must answer. */
  sublabel?: Text;
  detail: Detail;
  layout: "column" | "row";
  /** Items per row for "row" layouts; wraps onto further rows. */
  columns?: number;
  children: (ItemDef | SubDef)[];
};
export type NodeDef = {
  kind: "node";
  id: string;
  category: Category;
  label: Text;
  sublabel: Text;
  detail: Detail;
  emphasis?: boolean;
};

export type Side = "left" | "right" | "top" | "bottom";
export type EdgeDef = {
  id: string;
  from: string;
  to: string;
  fromSide: Side;
  toSide: Side;
  /** "money" edges are the links of the chain from capital to FCF that carry money, labelled with what they deduct. */
  kind: "flow" | "measure" | "money";
  label?: Text;
  /** What the label measures, shown above it in the panel; flow edges default to efficiency. */
  kicker?: Text;
  detail?: Detail;
  /** Box the line is drawn to, when it differs from the logical target. */
  drawTo?: string;
  /** A capability arrow on the chain from capital to FCF; drawn as thick as the money arrows. */
  chain?: boolean;
  /** Elements the edge belongs to without touching them, such as the stage whose cost a money arrow deducts. */
  ties?: string[];
  /** Route round the right-hand side of the map instead of straight across. */
  lane?: "right";
};

export type LoopDef = { id: string; label: Text; detail: Detail; cycle: string[] };
export type CompanyDef = { id: string; name: Text; focus: string[]; points: Text[]; refs?: string[]; links?: Link[] };
export type KeyPointDef = { id: string; title: Text; body: Text; ids: string[]; refs?: string[] };

export const t = (ja: string, en: string): Text => ({ ja, en });

export const item = (id: string, label: Text, detail: Detail): ItemDef => ({ kind: "item", id, label, detail });

export const sub = (id: string, label: Text, detail: Detail, items: ItemDef[]): SubDef => ({
  kind: "sub",
  id,
  label,
  detail,
  items,
});

export const isSub = (c: ItemDef | SubDef): c is SubDef => c.kind === "sub";

export const CATEGORY_LABEL: Record<Category, Text> = {
  money: t("資本から FCF までのチェーン", "Chain from capital to FCF"),
  resource: t("上流の資源", "Upstream resources"),
  compute: t("計算量", "Compute"),
  size: t("モデルの大きさ", "Model size"),
  stage: t("計算を使う段階", "Where compute is spent"),
  material: t("学習の材料", "Training data and tasks"),
  harness: t("ハーネス", "Harness"),
  context: t("推論時の文脈（IQ 層）", "Context (IQ layer)"),
  capability: t("能力と使い道", "Capability and uses"),
  measure: t("成果の測り方", "Measuring results"),
};

/** Border colours; the chain from capital to FCF and "capability" use the theme's foreground (ink) instead. */
export const CATEGORY_COLOR: Record<Category, string> = {
  money: "currentColor",
  resource: "#d4a017",
  compute: "#e07a95",
  size: "#8e8b82",
  stage: "#6a9bcc",
  material: "#5db872",
  harness: "#5db8a6",
  context: "#9db83f",
  capability: "currentColor",
  measure: "#9d8ac7",
};

export const EFFICIENCY_COLOR = "#cc785c";
export const LOOP_COLOR = "#e07a95";

export const LINK_KIND_LABEL: Record<LinkKind, Text> = {
  paper: t("研究", "Research"),
  news: t("報道", "News"),
  filing: t("開示資料", "Filing"),
  official: t("公式", "Official"),
  data: t("データ", "Data"),
  post: t("拙稿", "Related post"),
};
