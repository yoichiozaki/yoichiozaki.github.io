/**
 * Types and builders for the "levers of AI capability" map used in
 * content/blog/{ja,en}/ai-industry-capital-to-fcf.mdx (§5.2).
 *
 * The map separates what a model can do on its own ("model capability") from
 * what a whole system gets done ("completing the work"); the harness sits
 * between them. Labels on arrows name the efficiency that converts one thing
 * into the next, and dashed loops show how results flow back upstream.
 */

export type Locale = "ja" | "en";
export type Text = { ja: string; en: string };

export type Category =
  | "resource"
  | "compute"
  | "size"
  | "stage"
  | "material"
  | "harness"
  | "capability"
  | "measure";

/** `slug` links to another post on this blog; `href` to an external source. */
export type Link = { ja: string; en: string; href?: string; slug?: string };

export type Detail = {
  summary: Text;
  note?: Text;
  /** Article sections ("4.4") or chapters ("2") this element draws on. */
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
  kind: "flow" | "measure";
  label?: Text;
  detail?: Detail;
  /** Box the line is drawn to, when it differs from the logical target. */
  drawTo?: string;
};

export type LoopDef = { id: string; label: Text; detail: Detail; cycle: string[] };
export type CompanyDef = { id: string; name: Text; focus: string[]; points: Text[] };
export type KeyPointDef = { id: string; title: Text; body: Text; ids: string[] };

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
  resource: t("上流の資源", "Upstream resources"),
  compute: t("計算量", "Compute"),
  size: t("モデルの大きさ", "Model size"),
  stage: t("計算を使う段階", "Where compute is spent"),
  material: t("学習の材料", "Training data and tasks"),
  harness: t("ハーネス", "Harness"),
  capability: t("能力と使い道", "Capability and uses"),
  measure: t("成果の測り方", "Measuring results"),
};

/** Border colours; "capability" uses the theme's foreground instead. */
export const CATEGORY_COLOR: Record<Category, string> = {
  resource: "#d4a017",
  compute: "#e07a95",
  size: "#8e8b82",
  stage: "#6a9bcc",
  material: "#5db872",
  harness: "#5db8a6",
  capability: "currentColor",
  measure: "#9d8ac7",
};

export const EFFICIENCY_COLOR = "#cc785c";
export const LOOP_COLOR = "#e07a95";
