// Read-only locator for passages worth reviewing against the humanizer guides.
// It never edits files: every hit must be judged in context (see SKILL.md).
//
// Usage:
//   node .github/skills/humanizer/scripts/scan-patterns.mjs [--lang ja|en] [--summary] [--only id,id] [files...]
//
// Without file arguments it scans content/blog/{ja,en}/*.mdx.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..", "..");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args.splice(i, 1), true) : false;
};
const langFilter = opt("--lang");
const only = opt("--only")?.split(",");
const summary = flag("--summary");

// Katakana loanwords whose long-vowel form (末尾の長音) is preferred by the
// Japanese guide: -er/-or/-ar words, -y words with an established ー variant,
// and a few -re words whose ー form is the established spelling.
export const LONG_VOWEL_STEMS = [
  // -er / -or / -ar
  "アクセラレータ", "アダプタ", "アノテータ", "アロケータ", "イテレータ", "インスペクタ",
  "インターセプタ", "インターポーザ", "インタプリタ", "インデクサ", "ウェハ", "エグゼキュータ",
  "エグゼンプラ", "エディタ", "エンコーダ", "オーケストレータ", "オプティマイザ", "カウンタ",
  "カラムナ", "クラスタ", "クローラ", "コネクタ", "コレクタ", "コンストラクタ", "コンテナ",
  "コンパイラ", "コンピュータ", "コントローラ", "サーバ", "ジェネレータ", "シミュレータ", "ジッタ",
  "スカラ", "スキャナ", "スケジューラ", "スライダ", "セレクタ", "ソルバ", "タイマ", "ディスクリプタ",
  "ディスパッチャ", "デコーダ", "デコレータ", "デストラクタ", "トークナイザ", "ドライバ", "トランジスタ",
  "トリガ", "トレーラ", "ハンドラ", "パーサ", "バインダ", "バッファ", "パラメータ", "バランサ",
  "ビジュアライザ", "ビルダ", "ファクタ", "フィルタ", "フェイルオーバ", "フォルダ", "フッタ",
  "ブラウザ", "プランナ", "ブレーカ", "プレースホルダ", "プログラマ", "プロセッサ", "プロバイダ",
  "ブローカ", "ベクタ", "ベクトライザ", "ヘッダ", "ヘルパ", "ポインタ", "マネージャ", "ミューテータ",
  "メンバ", "モニタ", "ユーザ", "ラッパ", "ライタ", "リーダ", "リスナ", "リゾルバ", "リデューサ",
  "リミッタ", "ルータ", "レイヤ", "レジスタ", "レンダラ", "ワーカ", "オーダ", "プレッシャ", "ワイヤ",
  // -y
  "アセンブリ", "アドバイザリ", "エントリ", "カテゴリ", "クエリ", "サマリ", "ディスカバリ",
  "ディレクトリ", "テレメトリ", "トポロジ", "バイナリ", "ファクトリ", "フォージェリ", "プライマリ", "プロキシ",
  "メモリ", "ライブラリ", "リカバリ", "リポジトリ", "レイテンシ", "レジストリ",
  // -ty / -dy / -phy
  "アイデンティティ", "アクティビティ", "アフィニティ", "オブザーバビリティ", "カーディナリティ",
  "キャパシティ", "ケイパビリティ", "コミュニティ", "コモディティ", "スケーラビリティ",
  "セキュリティ", "ダーティ", "パーティ", "ペナルティ", "ポータビリティ", "プロパティ",
  "モジュラリティ", "ユーティリティ", "ローカリティ", "エンティティ", "ボディ", "コメディ",
  "スタディ", "プロソディ", "タイポグラフィ",
];

// Continuations that turn a stem into a different word (filtering, wireless,
// categorical, partition, per-cycle, column …). These are not missing long vowels.
const NOT_A_LONG_VOWEL = /^(?:リング|カル|アル|ント|ンス|ション|ビリティ|ブル|イズ|イゼーション|イクル|ング|ード|ム)/;

const longVowelRe = new RegExp(
  `(${[...LONG_VOWEL_STEMS].sort((a, b) => b.length - a.length).join("|")})(?!ー)([ァ-ヴー]*)`,
  "g",
);

const JA = [
  ["roundabout", /重要なのは|大切なのは|ポイントは[^。]{0,30}(?:点|こと)です|という点です|の価値は[^。]{0,30}にあ/],
  ["contrast", /単なる[^。]{0,30}ではな|[^。]{0,20}を超えて|だけではなく/],
  ["vague-link", /手掛かり|手がかり|考えるうえで(?:重要|大切|欠かせ)|理解する(?:うえ|上)で|鍵(?:となる|を握る)|カギ(?:となる|を握る)/],
  ["guide-phrase", /見ていきましょう|見ていきます|みましょう|していきます|解説します|紹介します|確認します/],
  ["self-reference", /本記事|この記事|本稿|本節|この節では|次の節では|以下では/],
  ["recap", /まとめると|要するに|つまり[、，]|言い換えると|ここまでを整理/],
  ["hedge", /とは限りません|わけではありません|注意が必要です|検証が必要です|留意が必要/],
  ["over-polite", /させていただ|となっております|となります。/],
  ["redundant", /まず最初に|約[0-9０-９.,]+[^。\s]{0,6}ほど|することができ|することが可能/],
  ["inflated", /強力な|画期的|革新的|飛躍的|劇的|圧倒的|極めて重要|非常に重要|不可欠です/],
  ["nominal", /化を(?:実施|行)|の実施|を実施し|を行います|を行う/],
  ["possibility", /可能性が考えられ/],
];

const EN = [
  ["connective", /\b(?:Furthermore|Moreover|Additionally|Importantly|Notably|Crucially|Ultimately|In essence|Overall|Indeed),/],
  ["importance", /\bIt(?:'s| is) (?:important|worth|crucial|essential|vital) (?:to note|noting|to remember|to understand)|\bthe key (?:insight|point|takeaway) is\b/i],
  ["inflated-verb", /\b(?:utiliz\w*|leverag\w*|facilitat\w*|boasts?|serves? as|delv\w*|showcas\w*|underscor\w*|empower\w*|streamlin\w*)\b/i],
  ["intensifier", /\b(?:dramatically|incredibly|seamless(?:ly)?|powerful|crucial|pivotal|game-chang\w*|cutting-edge|state-of-the-art|groundbreaking|revolutionary)\b/i],
  ["contrast", /\bnot (?:just|only|merely|simply)\b|\brather than (?:just|simply|merely)\b|\bmore than just\b/i],
  ["naming", /\b(?:This|which|that) is (?:called|known as|referred to as)\b/i],
  ["self-reference", /\bIn this (?:article|post|section)\b|\bThis (?:article|post|section) (?:will|explains|covers|walks|explores|describes)\b|\bLet(?:'s| us) (?:take a look|dive|explore|look|examine|walk)\b/i],
  ["recap", /\b(?:In summary|To summarize|In conclusion|In short|To put it simply|In other words|To recap)\b/i],
  ["hedge", /\b(?:does|do|is|are) not (?:necessarily|always)\b|\bmore research\b|\bremains? to be (?:seen|checked|verified)\b/i],
  ["fullwidth", /[、。（）：「」【】]/],
  ["figure-label", /\b(?:Figure|Table|Fig\.)\d/],
  ["date", /\b\d{4}\/\d{1,2}\/\d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/],
  ["chat-wrapper", /\b(?:Certainly!|I hope this helps|Here is the revised|Feel free to)\b/i],
];

// Return [lineNumber, text] pairs for prose: frontmatter title/description,
// body text and mermaid labels. Code fences (other than mermaid), inline code,
// URLs and import/export lines are blanked out.
function proseLines(src) {
  const lines = src.split(/\r?\n/);
  const out = [];
  let i = 0;
  if (lines[0] === "---") {
    for (i = 1; i < lines.length && lines[i] !== "---"; i++) {
      if (/^(title|description):/.test(lines[i])) out.push([i + 1, lines[i]]);
    }
    i++;
  }
  let fence = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*(`{3,}|~{3,})\s*([\w-]*)/);
    if (m) {
      if (!fence) {
        fence = { marker: m[1], lang: m[2] };
        continue;
      }
      if (line.trim().startsWith(fence.marker)) {
        fence = null;
        continue;
      }
    }
    if (fence && fence.lang !== "mermaid") continue;
    if (!fence && /^(import|export)\s/.test(line)) continue;
    const text = line
      .replace(/`[^`]*`/g, " ")
      .replace(/\]\([^)]*\)/g, "]")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\b(?:href|src|id|className|slug)=("[^"]*"|\{[^}]*\})/g, " ");
    out.push([i + 1, text]);
  }
  return out;
}

function langOf(file) {
  const norm = file.replace(/\\/g, "/");
  if (/\/ja\/|\.ja\./.test(norm)) return "ja";
  if (/\/en\/|\.en\./.test(norm)) return "en";
  return /[ぁ-んァ-ヴ一-龠]/.test(fs.readFileSync(file, "utf8")) ? "ja" : "en";
}

let files = args.filter((a) => !a.startsWith("--"));
if (files.length === 0) {
  for (const lang of ["ja", "en"]) {
    if (langFilter && langFilter !== lang) continue;
    const dir = path.join(repoRoot, "content", "blog", lang);
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
      files.push(path.join(dir, f));
    }
  }
}

const totals = {};
for (const file of files) {
  const lang = langOf(file);
  if (langFilter && langFilter !== lang) continue;
  const rules = lang === "ja" ? JA : EN;
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
  const counts = {};
  const hit = (id, line, text) => {
    if (only && !only.includes(id)) return;
    counts[id] = (counts[id] ?? 0) + 1;
    totals[id] = (totals[id] ?? 0) + 1;
    if (!summary) console.log(`${rel}:${line}: [${id}] ${text.trim().slice(0, 160)}`);
  };
  for (const [line, text] of proseLines(src)) {
    for (const [id, re] of rules) if (re.test(text)) hit(id, line, text);
    if (lang === "ja") {
      for (const m of text.matchAll(longVowelRe)) {
        if (NOT_A_LONG_VOWEL.test(m[2]) || (m[1] === "ワイヤ" && m[2].startsWith("レス"))) continue;
        hit("long-vowel", line, `${m[1]}${m[2]}  ←  ${text.trim().slice(0, 120)}`);
      }
    }
  }
  const strong = (src.match(/<strong>|\*\*[^*\n]+\*\*/g) ?? []).length;
  if (summary) {
    const parts = Object.entries(counts).map(([k, v]) => `${k}=${v}`);
    console.log(`${rel}: ${parts.join(" ") || "-"} strong=${strong}`);
  }
}
if (summary) {
  console.log("TOTAL", Object.entries(totals).map(([k, v]) => `${k}=${v}`).join(" "));
}
