"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * A real (miniature) SQL lexer. The trace below is produced by
 * actually running this scanner, so the visualization can never
 * drift out of sync with the rules described in the article.
 * ────────────────────────────────────────────────────────── */

const KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "JOIN",
  "ON",
  "AS",
  "ORDER",
  "BY",
  "ASC",
  "DESC",
  "LIMIT",
  "GROUP",
  "HAVING",
]);

type TokenKind =
  | "keyword"
  | "ident"
  | "number"
  | "string"
  | "operator"
  | "punct"
  | "eof";

type Token = {
  kind: TokenKind;
  text: string;
  start: number;
  end: number; // exclusive
};

type TraceStep = {
  /** cursor position when the scanner started this lexeme */
  cursor: number;
  token: Token;
  skippedWhitespace: number;
  rule: string;
  ruleEn: string;
  tokens: Token[];
};

const SOURCE = "SELECT name, age FROM users WHERE age >= 30;";

const isAlpha = (c: string) => /[A-Za-z_]/.test(c);
const isAlnum = (c: string) => /[A-Za-z0-9_]/.test(c);
const isDigit = (c: string) => /[0-9]/.test(c);

/** Two-character operators must be tried before one-character ones
 *  (maximal munch), otherwise ">=" would lex as ">" followed by "=". */
const TWO_CHAR_OPS = [">=", "<=", "<>", "!=", "||"];
const ONE_CHAR_OPS = "=<>+-*/%";
const PUNCT = ",();.";

function tokenize(src: string): TraceStep[] {
  const steps: TraceStep[] = [];
  const tokens: Token[] = [];
  let i = 0;

  const push = (
    token: Token,
    cursor: number,
    skipped: number,
    rule: string,
    ruleEn: string,
  ) => {
    tokens.push(token);
    steps.push({
      cursor,
      token,
      skippedWhitespace: skipped,
      rule,
      ruleEn,
      tokens: [...tokens],
    });
  };

  while (i < src.length) {
    const scanStart = i;
    while (i < src.length && /\s/.test(src[i])) i += 1;
    const skipped = i - scanStart;
    if (i >= src.length) break;

    const start = i;
    const c = src[i];

    if (isAlpha(c)) {
      while (i < src.length && isAlnum(src[i])) i += 1;
      const text = src.slice(start, i);
      const upper = text.toUpperCase();
      const isKeyword = KEYWORDS.has(upper);
      push(
        { kind: isKeyword ? "keyword" : "ident", text, start, end: i },
        start,
        skipped,
        isKeyword
          ? `英字で始まるので識別子として最長一致で読み取り、予約語表に「${upper}」があったので KEYWORD に分類`
          : `英字で始まるので最長一致で読み取り、予約語表に無いので IDENT（列名・表名の候補）に分類`,
        isKeyword
          ? `Starts with a letter, so it is read with maximal munch; "${upper}" is in the keyword table, so it becomes a KEYWORD.`
          : `Starts with a letter, read with maximal munch; not in the keyword table, so it becomes an IDENT (a column/table name candidate).`,
      );
      continue;
    }

    if (isDigit(c)) {
      while (i < src.length && isDigit(src[i])) i += 1;
      if (src[i] === "." && isDigit(src[i + 1] ?? "")) {
        i += 1;
        while (i < src.length && isDigit(src[i])) i += 1;
      }
      push(
        { kind: "number", text: src.slice(start, i), start, end: i },
        start,
        skipped,
        "数字で始まるので数値リテラルとして読み取り（小数点は後続が数字のときだけ取り込む）",
        "Starts with a digit, so it is read as a numeric literal (a dot is consumed only when followed by another digit).",
      );
      continue;
    }

    if (c === "'") {
      i += 1;
      while (i < src.length && src[i] !== "'") i += 1;
      if (i >= src.length) {
        // Without this the token would be emitted with end === len + 1,
        // highlighting one character past the end of the input.
        throw new Error("lexer: unterminated string literal");
      }
      i += 1; // closing quote
      push(
        { kind: "string", text: src.slice(start, i), start, end: i },
        start,
        skipped,
        "単引用符で始まるので文字列リテラル。閉じ引用符まで読み進める",
        "Starts with a single quote, so it is a string literal — scan until the closing quote.",
      );
      continue;
    }

    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      i += 2;
      push(
        { kind: "operator", text: two, start, end: i },
        start,
        skipped,
        `2文字演算子を先に試すのが最長一致（maximal munch）。「${two}」を1トークンとして確定`,
        `Two-character operators are tried first (maximal munch): "${two}" becomes a single token.`,
      );
      continue;
    }

    if (ONE_CHAR_OPS.includes(c)) {
      i += 1;
      push(
        { kind: "operator", text: c, start, end: i },
        start,
        skipped,
        "2文字演算子に一致しなかったので1文字演算子として確定",
        "No two-character operator matched, so it is emitted as a one-character operator.",
      );
      continue;
    }

    if (PUNCT.includes(c)) {
      i += 1;
      push(
        { kind: "punct", text: c, start, end: i },
        start,
        skipped,
        "区切り記号。構文解析器が構造を区切るために使う",
        "A punctuation character — the parser uses it to delimit structure.",
      );
      continue;
    }

    throw new Error(`lexer: unexpected character ${JSON.stringify(c)}`);
  }

  push(
    { kind: "eof", text: "<EOF>", start: src.length, end: src.length },
    src.length,
    0,
    "入力を読み切ったので EOF トークンを付加。構文解析器はこれを見て「文の終わり」を判定する",
    "Input is exhausted, so an EOF token is appended — the parser uses it to detect the end of the statement.",
  );

  return steps;
}

const KIND_STYLES: Record<TokenKind, string> = {
  keyword:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40",
  ident:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  number:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  string:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  operator:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
  punct:
    "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/40",
  eof: "bg-neutral-500/15 text-muted-foreground border-border",
};

type Props = { locale?: string };

export function SQLTokenizerVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const steps = useMemo(() => tokenize(SOURCE), []);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 850 });
  const current = steps[player.step];

  return (
    <InteractiveDemo
      title={isJa ? "字句解析器を1トークンずつ動かす" : "Running the Lexer, One Token at a Time"}
      description={
        isJa
          ? "SELECT name, age FROM users WHERE age >= 30; を左から走査し、どの規則でどのトークンが切り出されるかを追跡します。"
          : "Scanning SELECT name, age FROM users WHERE age >= 30; left to right, tracing which rule produces which token."
      }
    >
      <div className="space-y-4">
        {/* Source with cursor */}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isJa ? "入力文字列（バイト列）" : "Input string (raw bytes)"}
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-background p-3">
            <div className="flex font-mono text-sm whitespace-pre">
              {SOURCE.split("").map((ch, idx) => {
                const inCurrent =
                  idx >= current.token.start && idx < current.token.end;
                const consumed = idx < current.token.start;
                return (
                  <span
                    key={idx}
                    className={
                      inCurrent
                        ? "bg-accent/30 text-foreground font-bold rounded-sm"
                        : consumed
                          ? "text-muted-foreground"
                          : "text-foreground"
                    }
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                );
              })}
              <span
                className={
                  current.token.kind === "eof"
                    ? "bg-accent/30 rounded-sm px-1 font-bold"
                    : "opacity-0 px-1"
                }
              >
                ⏎
              </span>
            </div>
            <div className="mt-2 font-mono text-[11px] text-muted-foreground">
              cursor = {current.token.start}
              {current.skippedWhitespace > 0 && (
                <>
                  {"  ·  "}
                  {isJa
                    ? `空白 ${current.skippedWhitespace} 文字を読み飛ばし`
                    : `skipped ${current.skippedWhitespace} whitespace char(s)`}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rule that fired */}
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase ${KIND_STYLES[current.token.kind]}`}
            >
              {current.token.kind}
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {current.token.text}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {isJa ? current.rule : current.ruleEn}
          </p>
        </div>

        {/* Token stream so far */}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isJa
              ? `トークン列（${current.tokens.length} 個）`
              : `Token stream (${current.tokens.length})`}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {current.tokens.map((t, idx) => (
              <span
                key={idx}
                title={`${t.kind}: ${t.text}`}
                className={`rounded border px-2 py-0.5 font-mono text-xs ${KIND_STYLES[t.kind]} ${
                  idx === current.tokens.length - 1
                    ? "ring-2 ring-accent/50"
                    : ""
                }`}
              >
                <span className="sr-only">{t.kind}: </span>
                {t.text}
              </span>
            ))}
          </div>
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
