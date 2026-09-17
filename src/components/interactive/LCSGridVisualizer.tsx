"use client";

import { useMemo, useState } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ──────────────────────────────────────────────────────────
 * 2 本の列に対する «格子の DP»。同じ格子の上で、遷移の定義を
 * 差し替えるだけで LCS（最長共通部分列）と編集距離になる。
 * LCS は diff の骨格、編集距離はあいまい検索やスペル訂正の骨格。
 * ────────────────────────────────────────────────────────── */

const S = "axyb";
const T = "abyxb";
const M = S.length;
const NN = T.length;

type Mode = "lcs" | "edit";

type Op = "match" | "sub" | "del" | "ins";

type Step = {
  grid: number[][];
  cur: { i: number; j: number } | null;
  reads: { i: number; j: number }[];
  diagMatch: boolean;
  path: { i: number; j: number }[];
  result: string;
  ops: { op: Op; text: string }[];
  formula: string;
  ja: string;
  en: string;
};

function makeGrid(mode: Mode): number[][] {
  const g = Array.from({ length: M + 1 }, () => Array(NN + 1).fill(0));
  if (mode === "edit") {
    for (let i = 0; i <= M; i++) g[i][0] = i;
    for (let j = 0; j <= NN; j++) g[0][j] = j;
  }
  return g;
}

function buildSteps(mode: Mode): Step[] {
  const steps: Step[] = [];
  const g = makeGrid(mode);
  const base = (partial: Partial<Step>): Step => ({
    grid: g.map((r) => [...r]),
    cur: null,
    reads: [],
    diagMatch: false,
    path: [],
    result: "",
    ops: [],
    formula: "",
    ja: "",
    en: "",
    ...partial,
  });

  steps.push(
    base({
      formula:
        mode === "lcs"
          ? "dp[0][j] = dp[i][0] = 0"
          : "dp[0][j] = j,  dp[i][0] = i",
      ja:
        mode === "lcs"
          ? "境界を置きます。片方が空文字列なら共通部分列の長さは 0 です。この «空の行と列» があるおかげで、本体のループで場合分けが要らなくなります。"
          : "境界を置きます。空文字列から長さ j の文字列を作るには j 回の挿入が要ります。だから 0 行目は 0,1,2,… になります。",
      en:
        mode === "lcs"
          ? "Set the border. If either string is empty the common subsequence has length 0. Having this empty row and column removes special cases from the main loop."
          : "Set the border. Turning an empty string into a prefix of length j costs j insertions, so row 0 is 0,1,2,…",
    }),
  );

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= NN; j++) {
      const a = S[i - 1];
      const b = T[j - 1];
      const same = a === b;
      let formula: string;
      let ja: string;
      let en: string;
      let reads: { i: number; j: number }[];

      if (mode === "lcs") {
        if (same) {
          g[i][j] = g[i - 1][j - 1] + 1;
          reads = [{ i: i - 1, j: j - 1 }];
          formula = `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${g[i][j]}`;
          ja = `s[${i - 1}]='${a}' と t[${j - 1}]='${b}' が一致。この 1 文字を «使う» と決めれば、残りは両方から 1 文字ずつ削った部分問題そのものです。`;
          en = `s[${i - 1}]='${a}' matches t[${j - 1}]='${b}'. Once we commit to using this character, what remains is exactly the subproblem with one character removed from each string.`;
        } else {
          const up = g[i - 1][j];
          const left = g[i][j - 1];
          g[i][j] = Math.max(up, left);
          reads = [
            { i: i - 1, j },
            { i, j: j - 1 },
          ];
          formula = `dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${up}, dp[${i}][${j - 1}]=${left}) = ${g[i][j]}`;
          ja = `'${a}' ≠ '${b}'。この 2 文字を対応させることはできないので、«s 側を 1 文字捨てる» か «t 側を 1 文字捨てる» かの良いほうを取ります。`;
          en = `'${a}' ≠ '${b}', so these two characters cannot be paired. Take the better of dropping one character from s or one from t.`;
        }
      } else {
        if (same) {
          g[i][j] = g[i - 1][j - 1];
          reads = [{ i: i - 1, j: j - 1 }];
          formula = `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${g[i][j]}`;
          ja = `'${a}' = '${b}' なので、この位置では何もしなくてよい（コスト 0 の一致）。斜め上をそのまま持ってきます。`;
          en = `'${a}' = '${b}', so nothing has to be done here — a zero-cost match. Copy the diagonal.`;
        } else {
          const sub = g[i - 1][j - 1];
          const del = g[i - 1][j];
          const ins = g[i][j - 1];
          g[i][j] = 1 + Math.min(sub, del, ins);
          reads = [
            { i: i - 1, j: j - 1 },
            { i: i - 1, j },
            { i, j: j - 1 },
          ];
          formula = `dp[${i}][${j}] = 1 + min(置換 ${sub}, 削除 ${del}, 挿入 ${ins}) = ${g[i][j]}`;
          ja = `'${a}' ≠ '${b}'。置換（斜め）・削除（上）・挿入（左）の 3 通りに 1 手ぶんのコストを足し、最小を採ります。3 方向を見る、が編集距離の形です。`;
          en = `'${a}' ≠ '${b}'. Add one operation to each of substitute (diagonal), delete (up) and insert (left), and take the minimum. Looking in three directions is what makes this edit distance.`;
        }
      }

      steps.push(
        base({
          cur: { i, j },
          reads,
          diagMatch: same,
          formula,
          ja,
          en,
        }),
      );
    }
  }

  // ── 復元 ─────────────────────────────────────────
  const path: { i: number; j: number }[] = [];
  const ops: { op: Op; text: string }[] = [];
  let result = "";
  let i = M;
  let j = NN;

  const traceSteps: Step[] = [];
  path.push({ i, j });
  while (i > 0 || j > 0) {
    const a = i > 0 ? S[i - 1] : "";
    const b = j > 0 ? T[j - 1] : "";
    let ja: string;
    let en: string;
    let formula: string;

    if (mode === "lcs") {
      if (i > 0 && j > 0 && a === b) {
        result = a + result;
        ops.unshift({ op: "match", text: a });
        formula = `s[${i - 1}] = t[${j - 1}] = '${a}' → 採用`;
        ja = `斜め上から来た手。文字 '${a}' が共通部分列に入ります。`;
        en = `We arrived diagonally: character '${a}' belongs to the common subsequence.`;
        i--;
        j--;
      } else if (j === 0 || (i > 0 && g[i - 1][j] >= g[i][j - 1])) {
        formula = `dp[${i - 1}][${j}] ≥ dp[${i}][${j - 1}] → 上へ`;
        ja = `一致しないので、値が落ちない方向へ戻ります。ここでは上（s 側を捨てた手）。`;
        en = `No match, so we walk back in the direction that did not lose value — here upwards, meaning a character of s was dropped.`;
        i--;
      } else {
        formula = `dp[${i}][${j - 1}] > dp[${i - 1}][${j}] → 左へ`;
        ja = `一致しないので左へ戻ります（t 側を捨てた手）。`;
        en = `No match, so we walk left, meaning a character of t was dropped.`;
        j--;
      }
    } else {
      if (i > 0 && j > 0 && a === b && g[i][j] === g[i - 1][j - 1]) {
        ops.unshift({ op: "match", text: `= ${a}` });
        formula = `match '${a}'`;
        ja = `コスト 0 の一致。'${a}' はそのまま残ります。`;
        en = `A zero-cost match: '${a}' stays as it is.`;
        i--;
        j--;
      } else if (i > 0 && j > 0 && g[i][j] === g[i - 1][j - 1] + 1) {
        ops.unshift({ op: "sub", text: `${a}→${b}` });
        formula = `substitute '${a}' → '${b}'`;
        ja = `置換の手。'${a}' を '${b}' に書き換えた 1 手です。`;
        en = `A substitution: rewrite '${a}' as '${b}'.`;
        i--;
        j--;
      } else if (i > 0 && g[i][j] === g[i - 1][j] + 1) {
        ops.unshift({ op: "del", text: `−${a}` });
        formula = `delete '${a}'`;
        ja = `削除の手。s 側の '${a}' を消しました。`;
        en = `A deletion: remove '${a}' from s.`;
        i--;
      } else {
        ops.unshift({ op: "ins", text: `+${b}` });
        formula = `insert '${b}'`;
        ja = `挿入の手。t 側の '${b}' を追加しました。`;
        en = `An insertion: add '${b}' from t.`;
        j--;
      }
    }

    path.push({ i, j });
    traceSteps.push(
      base({
        cur: { i, j },
        path: [...path],
        result,
        ops: ops.map((o) => ({ ...o })),
        formula,
        ja,
        en,
      }),
    );
  }

  traceSteps.push(
    base({
      cur: { i: 0, j: 0 },
      path: [...path],
      result,
      ops: ops.map((o) => ({ ...o })),
      formula:
        mode === "lcs"
          ? `LCS = "${result}"  (length ${g[M][NN]})`
          : `edit distance = ${g[M][NN]}`,
      ja:
        mode === "lcs"
          ? `復元完了。LCS は "${result}"（長さ ${g[M][NN]}）。diff は «LCS に入らなかった文字» を削除・追加として表示しているだけです。`
          : `復元完了。編集距離は ${g[M][NN]}。復元した手順の列がそのまま «変更スクリプト» になります。`,
      en:
        mode === "lcs"
          ? `Done: the LCS is "${result}" (length ${g[M][NN]}). A diff is simply the characters that did not make it into the LCS, shown as deletions and insertions.`
          : `Done: the edit distance is ${g[M][NN]}. The reconstructed sequence of moves is the edit script itself.`,
    }),
  );

  return [...steps, ...traceSteps];
}

const opColor: Record<Op, string> = {
  match: "bg-muted text-muted-foreground",
  sub: "bg-[#e8a55a]/25 text-foreground",
  del: "bg-[#cc785c]/25 text-foreground",
  ins: "bg-[#5db8a6]/25 text-foreground",
};

export function LCSGridVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [mode, setMode] = useState<Mode>("lcs");
  const steps = useMemo(() => buildSteps(mode), [mode]);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 900 });
  const idx = Math.min(player.step, steps.length - 1);
  const s = steps[idx];

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    player.reset();
    setMode(m);
  };

  const cellsFilled = Math.min(idx, M * NN);
  const isRevealed = (i: number, j: number) =>
    i === 0 || j === 0 || (i - 1) * NN + (j - 1) < cellsFilled;
  const inPath = (i: number, j: number) =>
    s.path.some((p) => p.i === i && p.j === j);
  const isRead = (i: number, j: number) =>
    s.reads.some((r) => r.i === i && r.j === j);

  return (
    <InteractiveDemo
      title={
        isJa
          ? "格子の DP — LCS と編集距離は同じ表の別の遷移"
          : "The grid DP — LCS and edit distance are the same table, different transitions"
      }
      description={
        isJa
          ? `s = "${S}"、t = "${T}"。表の形も走査順も同じで、変わるのは «あるマスに入ってくる矢印の定義» だけです。`
          : `s = "${S}", t = "${T}". Same table, same scan order — only the definition of the arrows entering a cell changes.`
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(["lcs", "edit"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
            aria-pressed={mode === m}
          >
            {m === "lcs"
              ? isJa
                ? "LCS（最長共通部分列）"
                : "LCS"
              : isJa
                ? "編集距離（Levenshtein）"
                : "Edit distance"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
        <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
          <table className="border-collapse text-[12px] font-mono mx-auto">
            <thead>
              <tr>
                <th className="w-8" />
                <th className="w-8 px-1 py-1 text-[10px] text-muted-foreground">
                  ε
                </th>
                {T.split("").map((c, j) => (
                  <th
                    key={j}
                    scope="col"
                    className="w-8 px-1 py-1 text-[11px] font-semibold text-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.grid.map((rowVals, i) => (
                <tr key={i}>
                  <th
                    scope="row"
                    className="w-8 px-1 py-1 text-[11px] font-semibold text-foreground"
                  >
                    {i === 0 ? (
                      <span className="text-[10px] text-muted-foreground">
                        ε
                      </span>
                    ) : (
                      S[i - 1]
                    )}
                  </th>
                  {rowVals.map((v, j) => {
                    const cur = s.cur?.i === i && s.cur?.j === j;
                    return (
                      <td
                        key={j}
                        className={`w-8 border px-1 py-1.5 text-center transition-colors ${
                          cur
                            ? "border-accent bg-accent/25 text-foreground font-semibold"
                            : inPath(i, j)
                              ? "border-[#5db8a6] bg-[#5db8a6]/25 text-foreground"
                              : isRead(i, j)
                                ? "border-[#e8a55a] bg-[#e8a55a]/20 text-foreground"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {isRevealed(i, j) ? v : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {isJa
              ? "行 = s の接頭辞、列 = t の接頭辞。各マスには «そこまでの部分問題の答え» が 1 つだけ入ります。"
              : "Rows are prefixes of s, columns are prefixes of t. Each cell holds exactly one number: the answer to that subproblem."}
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[10px] font-semibold text-muted-foreground mb-1">
              {isJa ? "いま適用している式" : "Recurrence applied now"}
            </div>
            <code className="block text-[11px] font-mono text-foreground break-words">
              {s.formula || "—"}
            </code>
          </div>

          {mode === "lcs" ? (
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                {isJa ? "復元された共通部分列" : "Reconstructed subsequence"}
              </div>
              <div className="font-mono text-lg text-foreground tracking-widest">
                {s.result || "—"}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                {isJa ? "復元された編集スクリプト" : "Reconstructed edit script"}
              </div>
              <div className="flex flex-wrap gap-1">
                {s.ops.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  s.ops.map((o, k) => (
                    <span
                      key={k}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-mono ${opColor[o.op]}`}
                    >
                      {o.text}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground min-h-[84px]">
            {isJa ? s.ja : s.en}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          step={idx}
          isFirst={idx === 0}
          isLast={idx === steps.length - 1}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
