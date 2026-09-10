// Repo-wide mechanical audit of blog MDX files.
// Read-only: reports issues, changes nothing.
import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/oaz77/source/repos/yoichiozaki.github.io";
const locales = ["ja", "en"];
const issues = [];

function add(kind, slug, locale, detail) {
  issues.push({ kind, slug, locale, detail });
}

const slugsByLocale = {};
for (const loc of locales) {
  slugsByLocale[loc] = new Set(
    fs.readdirSync(path.join(root, "content/blog", loc))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, "")),
  );
}

// Components registered for MDX use
const pageSrc = fs.readFileSync(
  path.join(root, "src/app/[locale]/blog/[slug]/page.tsx"),
  "utf8",
);
const registered = new Set();
for (const m of pageSrc.matchAll(/^\s{4}([A-Z][A-Za-z0-9]*)\s*:/gm)) registered.add(m[1]);
for (const m of pageSrc.matchAll(/^\s{4}([A-Z][A-Za-z0-9]*),$/gm)) registered.add(m[1]);
// bare shorthand entries like `Mermaid,` / `InteractiveDemo,`
for (const m of pageSrc.matchAll(/^\s+(Mermaid|InteractiveDemo),$/gm)) registered.add(m[1]);

const MERMAID_RESERVED = new Set([
  "opt", "loop", "alt", "else", "end", "par", "critical", "break", "rect", "note",
  "activate", "deactivate", "autonumber",
]);

const KNOWN_LANGS = new Set([
  "ts", "tsx", "typescript", "js", "jsx", "javascript", "json", "json5", "yaml", "yml", "toml", "ini",
  "go", "rust", "rs", "c", "cpp", "cc", "h", "hpp", "csharp", "cs", "java",
  "kotlin", "swift", "python", "py", "ruby", "rb", "php", "scala", "haskell",
  "sql", "bash", "sh", "shell", "zsh", "powershell", "ps1", "console",
  "html", "css", "scss", "xml", "svg", "diff", "patch", "makefile", "dockerfile",
  "text", "txt", "plaintext", "mermaid", "proto", "graphql", "http", "md",
  "mdx", "lua", "elixir", "erlang", "clojure", "fsharp", "vb", "asm", "llvm",
  "nginx", "apache", "csv", "tsv", "regex", "ebnf", "abnf", "latex", "tex",
  "bicep", "prolog", "terraform", "hcl", "graphviz", "dot", "vim", "awk", "sed",
]);

const frontmatterByLocale = {};
const structureByLocale = {};

for (const loc of locales) {
  for (const slug of slugsByLocale[loc]) {
    const file = path.join(root, "content/blog", loc, `${slug}.mdx`);
    const raw = fs.readFileSync(file, "utf8");
    const lines = raw.split(/\r?\n/);

    // ---- frontmatter ----
    if (!raw.startsWith("---")) {
      add("frontmatter-missing", slug, loc, "file does not start with ---");
      continue;
    }
    const fmEnd = lines.indexOf("---", 1);
    const fm = lines.slice(1, fmEnd);
    const get = (k) => {
      const l = fm.find((x) => x.startsWith(k + ":"));
      return l ? l.slice(k.length + 1).trim().replace(/^"|"$/g, "") : null;
    };
    const meta = {
      title: get("title"),
      date: get("date"),
      description: get("description"),
      tags: get("tags"),
    };
    frontmatterByLocale[`${loc}/${slug}`] = meta;
    for (const k of ["title", "date", "description", "tags"]) {
      if (!meta[k]) add("frontmatter-field", slug, loc, `missing ${k}`);
    }
    if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date))
      add("frontmatter-date", slug, loc, `bad date format: ${meta.date}`);

    const body = lines.slice(fmEnd + 1);

    // ---- fenced code blocks ----
    let inFence = false;
    let fenceStart = 0;
    const mermaidBlocks = [];
    let mermaidBuf = null;
    body.forEach((line, i) => {
      const ln = i + fmEnd + 2;
      const m = line.match(/^(\s*)```(.*)$/);
      if (!m) {
        if (mermaidBuf) mermaidBuf.push(line);
        return;
      }
      const info = m[2].trim();
      if (!inFence) {
        inFence = true;
        fenceStart = ln;
        if (info === "") add("fence-no-lang", slug, loc, `line ${ln}: opening fence has no language tag`);
        else {
          const base = info.split(/\s+/)[0].toLowerCase().replace(/[:{].*$/, "");
          if (/\s/.test(info) || info.length > 24 || !KNOWN_LANGS.has(base))
            add("fence-bad-lang", slug, loc, `line ${ln}: suspicious fence info string "${info.slice(0, 70)}" — likely a mangled fence`);
        }
        if (info === "mermaid") mermaidBuf = [];
      } else {
        if (info !== "") {
          // a fence that closes should be bare; a non-bare one means nesting confusion
          add("fence-close-lang", slug, loc, `line ${ln}: closing fence carries text "${info}"`);
        }
        if (mermaidBuf) {
          mermaidBlocks.push({ start: fenceStart, lines: mermaidBuf });
          mermaidBuf = null;
        }
        inFence = false;
      }
    });
    if (inFence) add("fence-unclosed", slug, loc, `unclosed fence opened at line ${fenceStart}`);

    // ---- mermaid pitfalls ----
    for (const blk of mermaidBlocks) {
      const text = blk.lines.join("\n");
      const isSeq = /^\s*sequenceDiagram/m.test(text);
      if (isSeq) {
        for (const m of text.matchAll(/participant\s+([A-Za-z0-9_]+)/g)) {
          if (MERMAID_RESERVED.has(m[1].toLowerCase()))
            add("mermaid-reserved", slug, loc, `line ~${blk.start}: participant id "${m[1]}" is a reserved keyword`);
        }
      }
      // angle brackets that mermaid treats as HTML.
      // `<<Stereotype>>` is valid classDiagram annotation syntax, so strip those first.
      const stripped = text.replace(/<<[^>]*>>/g, "");
      const angle = stripped.match(/<[A-Za-z][A-Za-z0-9]*>/g);
      if (angle) add("mermaid-angle", slug, loc, `line ~${blk.start}: angle-bracket token(s) ${[...new Set(angle)].join(",")}`);
      // low-contrast fills without explicit color
      for (const m of text.matchAll(/style\s+\S+\s+fill:(#[0-9a-fA-F]{3,6})([^\n]*)/g)) {
        const rest = m[2] || "";
        const hex = m[1].replace("#", "");
        const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
        const lum =
          (0.2126 * parseInt(full.slice(0, 2), 16) +
            0.7152 * parseInt(full.slice(2, 4), 16) +
            0.0722 * parseInt(full.slice(4, 6), 16)) / 255;
        if (lum > 0.72 && !/color\s*:/.test(rest))
          add("mermaid-contrast", slug, loc, `line ~${blk.start}: light fill ${m[1]} without explicit color: (unreadable in dark mode)`);
      }
    }

    // ---- markdown bold outside code fences ----
    // NOTE: verified that `**bold**` renders correctly to <strong> even in CJK text,
    // so this is a style preference, not a defect. Not reported.

    // ---- structure snapshot for ja/en drift detection ----
    structureByLocale[`${loc}/${slug}`] = {
      h2: body.filter((l) => /^## /.test(l)).length,
      h3: body.filter((l) => /^### /.test(l)).length,
      fences: body.filter((l) => /^\s*```/.test(l)).length,
      mermaid: body.filter((l) => /^\s*```mermaid/.test(l)).length,
      tables: body.filter((l) => /^\|\s*---/.test(l)).length,
    };

    // ---- duplicated long paragraphs (signature of splice corruption) ----
    // A long paragraph appearing twice in one article is almost always the result
    // of a botched edit pasting a fragment somewhere it does not belong.
    {
      let fence = false;
      const paras = [];
      let buf = [];
      for (const line of body) {
        if (/^\s*```/.test(line)) { fence = !fence; if (buf.length) { paras.push(buf.join(" ")); buf = []; } continue; }
        if (fence) continue;
        if (line.trim() === "") { if (buf.length) { paras.push(buf.join(" ")); buf = []; } continue; }
        buf.push(line.trim());
      }
      if (buf.length) paras.push(buf.join(" "));
      const seen = new Map();
      for (const p of paras) {
        const norm = p.replace(/\s+/g, " ").trim();
        if (norm.length < 120) continue;
        if (/^\|/.test(norm)) continue;           // tables legitimately repeat headers
        seen.set(norm, (seen.get(norm) ?? 0) + 1);
      }
      for (const [p, n] of seen) {
        if (n > 1) add("dup-paragraph", slug, loc, `paragraph repeated ${n}x: "${p.slice(0, 90)}..."`);
      }
    }

    // ---- stray structural markers inside code fences ----
    {
      let fence = false;
      let lang = "";
      body.forEach((line, i) => {
        const m = line.match(/^\s*```(.*)$/);
        if (m) { if (!fence) { lang = m[1].trim(); } fence = !fence; return; }
        if (!fence) return;
        if (lang === "text" || lang === "mermaid" || lang === "md" || lang === "mdx" || lang === "diff") return;
        // Markdown table separators and checklist items inside a code block are a
        // strong signal of spliced content. (Headings are excluded: template
        // literals holding Markdown prompts are common and legitimate here.)
        if (/^\|\s*---/.test(line) || /^- \[[ x]\] /.test(line))
          add("marker-in-fence", slug, loc, `line ${i + fmEnd + 2}: markdown structure inside a \`${lang}\` code block — "${line.trim().slice(0, 60)}"`);
      });
    }

    // ---- internal links ----
    for (const m of raw.matchAll(/\]\((\/(ja|en)\/blog\/([a-z0-9-]+))\)/g)) {
      const [, href, linkLoc, target] = m;
      if (!slugsByLocale[linkLoc].has(target))
        add("link-broken", slug, loc, `link to ${href} — no such slug`);
      if (linkLoc !== loc)
        add("link-locale", slug, loc, `${loc} article links to ${linkLoc} article: ${href}`);
    }

    // ---- component tags used but not registered ----
    inFence = false;
    body.forEach((line, i) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return; }
      if (inFence) return;
      for (const m of line.matchAll(/<([A-Z][A-Za-z0-9]*)\s*\/>/g)) {
        if (!registered.has(m[1]))
          add("component-unregistered", slug, loc, `line ${i + fmEnd + 2}: <${m[1]} /> not registered in page.tsx`);
      }
    });
  }
}

// ---- ja/en frontmatter cross-check ----
for (const slug of slugsByLocale.ja) {
  if (!slugsByLocale.en.has(slug)) { add("pair-missing", slug, "en", "no English counterpart"); continue; }
  const a = frontmatterByLocale[`ja/${slug}`];
  const b = frontmatterByLocale[`en/${slug}`];
  if (!a || !b) continue;
  if (a.date !== b.date) add("pair-date", slug, "-", `ja date ${a.date} != en date ${b.date}`);
  const sa = structureByLocale[`ja/${slug}`];
  const sb = structureByLocale[`en/${slug}`];
  if (sa && sb) {
    for (const k of ["h2", "h3", "fences", "mermaid", "tables"]) {
      if (sa[k] !== sb[k])
        add("pair-structure", slug, "-", `${k}: ja=${sa[k]} en=${sb[k]} (content may be lost or duplicated)`);
    }
  }
}
for (const slug of slugsByLocale.en) {
  if (!slugsByLocale.ja.has(slug)) add("pair-missing", slug, "ja", "no Japanese counterpart");
}

// ---- output ----
const byKind = {};
for (const it of issues) (byKind[it.kind] ??= []).push(it);
const order = Object.keys(byKind).sort((x, y) => byKind[y].length - byKind[x].length);
console.log(`TOTAL ISSUES: ${issues.length}\n`);
for (const k of order) {
  console.log(`## ${k} (${byKind[k].length})`);
  for (const it of byKind[k].slice(0, 40)) console.log(`  ${it.slug} [${it.locale}] ${it.detail}`);
  if (byKind[k].length > 40) console.log(`  ... and ${byKind[k].length - 40} more`);
  console.log("");
}
