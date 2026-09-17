"use client";

type DiagramProps = { locale?: string };

/* ──────────────────────────────────────────────────────────
 * 動的計画法の «設計手順» と «型» を一覧にする静的コンポーネント群。
 * ────────────────────────────────────────────────────────── */

/* ── 1. 設計の 6 ステップ ─────────────────────── */

export function DPDesignSteps({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const steps = isJa
    ? [
        {
          n: "1",
          title: "全探索を «決め方の列» として書く",
          q: "答えを作るために、順番に何を決めていくのか？",
          bad: "決める順番が定まらない／1 回の決定で複数箇所が変わる",
        },
        {
          n: "2",
          title: "続きに必要な情報だけを残す",
          q: "ここまでの決定のうち、この先の最適な選び方に影響するのは何か？",
          bad: "「何を覚えれば十分か」が言えない＝状態が未定義",
        },
        {
          n: "3",
          title: "状態を «関数の引数» として書き下す",
          q: "f(引数) = 残りを最適に決めたときの値、と一文で言えるか？",
          bad: "引数に «経路そのもの» が入っている＝圧縮できていない",
        },
        {
          n: "4",
          title: "遷移と基底を書く",
          q: "次の 1 手の選択肢は何通りで、それぞれどの状態に移るか？",
          bad: "遷移先が自分と同じか、より «進んでいない» 状態を指している",
        },
        {
          n: "5",
          title: "計算量を «状態数 × 遷移数» で見積もる",
          q: "その積は制約に収まるか？ 収まらないなら状態か遷移のどちらを削るか？",
          bad: "見積もりをせずに実装を始める",
        },
        {
          n: "6",
          title: "評価順序を決める（メモ化 or ループ）",
          q: "依存が DAG になっているか？ ループなら添字はどの向きに回すか？",
          bad: "依存に循環がある（＝そのままでは DP にならない）",
        },
      ]
    : [
        {
          n: "1",
          title: "Write brute force as a sequence of decisions",
          q: "What do we decide, one at a time, to build an answer?",
          bad: "No natural decision order, or one decision changes several places at once",
        },
        {
          n: "2",
          title: "Keep only what the future needs",
          q: "Of everything decided so far, what still affects the best way to continue?",
          bad: "You cannot say what is sufficient to remember — the state is undefined",
        },
        {
          n: "3",
          title: "Write the state as function arguments",
          q: "Can you say in one sentence: f(args) = best value for the rest?",
          bad: "An argument is the path itself — nothing has been compressed",
        },
        {
          n: "4",
          title: "Write the transitions and the base cases",
          q: "How many choices does the next decision have, and where does each lead?",
          bad: "A transition points to itself or to a state that is not further along",
        },
        {
          n: "5",
          title: "Estimate cost as states × transitions",
          q: "Does that product fit the limits? If not, cut states or cut transitions?",
          bad: "Starting to code before doing this multiplication",
        },
        {
          n: "6",
          title: "Choose an evaluation order (memo or loop)",
          q: "Is the dependency graph a DAG? If looping, in which direction?",
          bad: "The dependencies contain a cycle — it is not a DP as written",
        },
      ];

  return (
    <div className="not-prose my-6 space-y-2">
      {steps.map((s) => (
        <div
          key={s.n}
          className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-accent-foreground">
            {s.n}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              {s.title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {isJa ? "問い: " : "Ask: "}
              </span>
              {s.q}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-[#cc785c]">
                {isJa ? "詰まる兆候: " : "Warning sign: "}
              </span>
              {s.bad}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 2. 典型パターン一覧 ─────────────────────── */

export function DPPatternTable({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const rows = isJa
    ? [
        {
          name: "線形 DP",
          state: "dp[i] = i 番目«で終わる»／«まで見た» ときの最適値",
          trans: "直前 k 個からの選択",
          cost: "O(nk)",
          ex: "Frog、階段の登り方、LIS（素朴版）",
        },
        {
          name: "ナップサック DP",
          state: "dp[i][w] = i 個目まで見て、重さ合計 w 以下のときの最大価値",
          trans: "取る / 取らない",
          cost: "O(nW)（疑似多項式）",
          ex: "0-1・個数制限・個数無制限ナップサック、部分和",
        },
        {
          name: "格子 DP",
          state: "dp[i][j] = 2 本の列の接頭辞 (i, j) に対する最適値",
          trans: "斜め・上・左の 3 方向",
          cost: "O(nm)",
          ex: "LCS、編集距離、diff、DTW",
        },
        {
          name: "区間 DP",
          state: "dp[l][r] = 区間 [l, r) をまとめたときの最適値",
          trans: "分割点 k を全探索",
          cost: "O(n³)（四角不等式なら O(n²)）",
          ex: "行列連鎖積、最適二分探索木、スライム合体",
        },
        {
          name: "木 DP",
          state: "dp[v][…] = v を根とする部分木の最適値",
          trans: "子の結果をマージ",
          cost: "O(n × 状態)",
          ex: "部分木の最大独立集合、木の直径、全方位木 DP",
        },
        {
          name: "bit DP（状態圧縮）",
          state: "dp[S][v] = 訪問済み集合 S、現在地 v",
          trans: "未訪問の 1 要素を追加",
          cost: "O(2ⁿ n²)",
          ex: "TSP、二部マッチングの数え上げ、集合分割",
        },
        {
          name: "桁 DP",
          state: "dp[桁][上限に張り付いているか][条件用の状態]",
          trans: "その桁に 0..9 を置く",
          cost: "O(桁数 × 状態 × 10)",
          ex: "区間 [A, B] 内で条件を満たす整数の数え上げ",
        },
        {
          name: "確率・期待値 DP",
          state: "dp[状態] = そこから先の確率／期待値",
          trans: "期待値の線形性で分岐を合成",
          cost: "状態数 × 遷移数",
          ex: "サイコロ、ランダムウォーク、ゲームの勝率",
        },
        {
          name: "部分集合の畳み込み（SOS DP）",
          state: "dp[S] = S のすべての部分集合にわたる集約",
          trans: "ビットを 1 本ずつ処理",
          cost: "O(2ⁿ n)（素朴には O(3ⁿ)）",
          ex: "ゼータ／メビウス変換、条件を満たす集合の数え上げ",
        },
      ]
    : [
        {
          name: "Linear DP",
          state: "dp[i] = best value ending at / considering the first i items",
          trans: "choose among the previous k positions",
          cost: "O(nk)",
          ex: "Frog, stair climbing, naive LIS",
        },
        {
          name: "Knapsack DP",
          state: "dp[i][w] = best value using the first i items at weight at most w",
          trans: "take it or skip it",
          cost: "O(nW), pseudo-polynomial",
          ex: "0-1, bounded and unbounded knapsack, subset sum",
        },
        {
          name: "Grid DP",
          state: "dp[i][j] = best value for prefixes (i, j) of two sequences",
          trans: "diagonal, up, left",
          cost: "O(nm)",
          ex: "LCS, edit distance, diff, DTW",
        },
        {
          name: "Interval DP",
          state: "dp[l][r] = best value for the interval [l, r)",
          trans: "enumerate the split point k",
          cost: "O(n³), or O(n²) under the quadrangle inequality",
          ex: "matrix chain multiplication, optimal BST, slime merging",
        },
        {
          name: "Tree DP",
          state: "dp[v][…] = best value for the subtree rooted at v",
          trans: "merge the children's results",
          cost: "O(n × states)",
          ex: "maximum independent set on a tree, diameter, rerooting",
        },
        {
          name: "Bitmask DP",
          state: "dp[S][v] = visited set S, currently at v",
          trans: "add one unvisited element",
          cost: "O(2ⁿ n²)",
          ex: "TSP, counting perfect matchings, set partitioning",
        },
        {
          name: "Digit DP",
          state: "dp[position][is-tight][condition state]",
          trans: "place a digit 0..9",
          cost: "O(digits × states × 10)",
          ex: "counting integers in [A, B] with a property",
        },
        {
          name: "Probability / expectation DP",
          state: "dp[state] = probability or expected value from here on",
          trans: "combine branches by linearity of expectation",
          cost: "states × transitions",
          ex: "dice games, random walks, win probabilities",
        },
        {
          name: "Subset convolution (SOS DP)",
          state: "dp[S] = aggregate over every subset of S",
          trans: "process one bit at a time",
          cost: "O(2ⁿ n), versus O(3ⁿ) naively",
          ex: "zeta / Möbius transforms, counting qualifying sets",
        },
      ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "型" : "Pattern"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "状態の定義" : "State"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "遷移" : "Transition"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "計算量" : "Cost"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "代表例" : "Examples"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border align-top">
              <td className="px-2 py-2 font-medium text-foreground whitespace-nowrap">
                {r.name}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r.state}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.trans}</td>
              <td className="px-2 py-2 font-mono text-muted-foreground whitespace-nowrap">
                {r.cost}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r.ex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 3. 遷移の高速化カタログ ─────────────────── */

export function DPOptimizationTable({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const rows = isJa
    ? [
        {
          symptom: "遷移が «区間の総和» になっている",
          tech: "累積和 / いもす法",
          gain: "遷移 O(n) → O(1)",
          cond: "演算が加法的で逆元がある",
        },
        {
          symptom: "遷移が «幅 k の窓の min / max»",
          tech: "スライド最小値（単調両端キュー）",
          gain: "遷移 O(k) → 償却 O(1)",
          cond: "窓が単調に動く",
        },
        {
          symptom: "dp[i] = min_j ( dp[j] + a_j · x_i ) の形",
          tech: "Convex Hull Trick / Li Chao 木",
          gain: "O(n²) → O(n log n)（条件次第で O(n)）",
          cond: "遷移が «直線の族の下側包絡線»",
        },
        {
          symptom: "区間 DP で分割点を全探索している",
          tech: "Knuth–Yao 高速化 / 分割統治最適化",
          gain: "O(n³) → O(n²)、O(n²) → O(n log n)",
          cond: "四角不等式（コストの凸性）と最適分割点の単調性",
        },
        {
          symptom: "「ちょうど k 個選ぶ」の次元が重い",
          tech: "Alien's trick（WQS 二分探索・ラグランジュ緩和）",
          gain: "次元をひとつ落とす",
          cond: "最適値が k について凸",
        },
        {
          symptom: "線形漸化式で n が 10⁹ 級",
          tech: "行列累乗 / Kitamasa 法",
          gain: "O(n) → O(k³ log n) / O(k log k log n)",
          cond: "定数係数の線形漸化式",
        },
        {
          symptom: "同じ品物が最大 c 個まで使える",
          tech: "二進法分割、またはスライド最小値",
          gain: "O(nWc) → O(nW log c) / O(nW)",
          cond: "個数制限ナップサック",
        },
        {
          symptom: "すべての S について部分集合の和が要る",
          tech: "SOS DP（高速ゼータ／メビウス変換）",
          gain: "O(3ⁿ) → O(2ⁿ n)",
          cond: "部分集合束の上での畳み込み",
        },
      ]
    : [
        {
          symptom: "The transition is a sum over a range",
          tech: "Prefix sums / difference arrays",
          gain: "O(n) → O(1) per transition",
          cond: "The operation is additive and invertible",
        },
        {
          symptom: "The transition is a min/max over a sliding window of width k",
          tech: "Sliding-window minimum (monotonic deque)",
          gain: "O(k) → amortised O(1)",
          cond: "The window moves monotonically",
        },
        {
          symptom: "dp[i] = min_j ( dp[j] + a_j · x_i )",
          tech: "Convex hull trick / Li Chao tree",
          gain: "O(n²) → O(n log n), sometimes O(n)",
          cond: "The transition is a lower envelope of lines",
        },
        {
          symptom: "An interval DP enumerates every split point",
          tech: "Knuth–Yao speedup / divide-and-conquer optimisation",
          gain: "O(n³) → O(n²), O(n²) → O(n log n)",
          cond: "Quadrangle inequality and monotone optimal split points",
        },
        {
          symptom: "A “choose exactly k” dimension dominates the cost",
          tech: "Alien's trick (WQS binary search, Lagrangian relaxation)",
          gain: "Removes one dimension",
          cond: "The optimum is convex in k",
        },
        {
          symptom: "A linear recurrence with n around 10⁹",
          tech: "Matrix exponentiation / Kitamasa",
          gain: "O(n) → O(k³ log n) or O(k log k log n)",
          cond: "Constant-coefficient linear recurrence",
        },
        {
          symptom: "Each item may be used up to c times",
          tech: "Binary splitting, or sliding-window minimum",
          gain: "O(nWc) → O(nW log c) or O(nW)",
          cond: "Bounded knapsack",
        },
        {
          symptom: "You need subset sums for every S",
          tech: "SOS DP (fast zeta / Möbius transform)",
          gain: "O(3ⁿ) → O(2ⁿ n)",
          cond: "Convolution over the subset lattice",
        },
      ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "症状" : "Symptom"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "手法" : "Technique"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "効果" : "Gain"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "適用条件" : "Precondition"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tech} className="border-b border-border align-top">
              <td className="px-2 py-2 text-foreground">{r.symptom}</td>
              <td className="px-2 py-2 font-medium text-foreground">{r.tech}</td>
              <td className="px-2 py-2 font-mono text-muted-foreground">
                {r.gain}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r.cond}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 4. メモ化 vs ループ ─────────────────────── */

export function MemoVsTabulation({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const rows = isJa
    ? [
        ["評価される状態", "必要な状態だけ（遅延評価）", "定義域すべて"],
        ["評価順序", "呼び出し順に自動で決まる", "自分で正しい順序を書く"],
        ["疎な状態空間", "強い。到達不能な状態は触らない", "無駄が出る（添字圧縮が要る）"],
        ["定数倍", "再帰・ハッシュ表のぶん遅い", "配列を順に舐めるので速い"],
        ["メモリ", "再帰スタック（深さに比例）", "ローリング配列で次元を落とせる"],
        ["スタック溢れ", "深さ 10⁵ 超で危険", "起きない"],
        ["最適化との相性", "しづらい", "累積和・スライド最小値などを載せやすい"],
        ["書きやすさ", "漸化式をほぼそのまま書ける", "順序と境界を自分で詰める必要がある"],
      ]
    : [
        ["States evaluated", "Only those reached (lazy)", "The whole domain"],
        ["Evaluation order", "Falls out of the call order", "You must get it right yourself"],
        ["Sparse state spaces", "Strong — unreachable states cost nothing", "Wasteful; needs index compression"],
        ["Constant factor", "Slower: recursion and hash lookups", "Fast: a linear sweep over an array"],
        ["Memory", "Recursion stack proportional to depth", "Rolling arrays can drop a dimension"],
        ["Stack overflow", "A real risk beyond depth ~10⁵", "Cannot happen"],
        ["Amenable to speedups", "Harder", "Prefix sums, monotonic deques, CHT slot in naturally"],
        ["Ease of writing", "Almost a transcription of the recurrence", "You own the order and the boundaries"],
      ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "観点" : "Aspect"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "メモ化再帰（トップダウン）" : "Memoised recursion (top-down)"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "配列ループ（ボトムアップ）" : "Tabulation (bottom-up)"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border align-top">
              <td className="px-2 py-2 font-medium text-foreground whitespace-nowrap">
                {r[0]}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r[1]}</td>
              <td className="px-2 py-2 text-muted-foreground">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 5. 貪欲が壊れる最小反例 ─────────────────── */

function CoinPickRow({
  label,
  picks,
  good,
  isJa,
}: {
  label: string;
  picks: number[];
  good: boolean;
  isJa: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-40 shrink-0 text-xs ${good ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <div className="flex gap-1">
        {picks.map((c, i) => (
          <span
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-mono ${
              good
                ? "border-[#5db8a6] bg-[#5db8a6]/20 text-foreground"
                : "border-[#cc785c] bg-[#cc785c]/15 text-foreground"
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        = {picks.reduce((a, b) => a + b, 0)} ({picks.length}
        {isJa ? " 枚" : " coins"})
      </span>
    </div>
  );
}

export function GreedyFailureDiagram({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const coins = [1, 3, 4];
  const target = 6;
  const greedy = [4, 1, 1];
  const optimal = [3, 3];

  return (
    <div className="not-prose my-6 rounded-lg border border-border bg-muted/40 p-4">
      <div className="text-sm font-semibold text-foreground">
        {isJa
          ? `硬貨 {${coins.join(", ")}} で ${target} を作る`
          : `Making ${target} from coins {${coins.join(", ")}}`}
      </div>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">
        {isJa
          ? "「いま使える最大の硬貨を取る」という貪欲法は、この硬貨系では最適になりません。局所的な最良手が、大域的な最適解の一部とは限らないからです。"
          : "“Always take the largest usable coin” is not optimal for this coin system: a locally best move need not belong to any globally optimal solution."}
      </p>
      <div className="space-y-2">
        <CoinPickRow
          label={isJa ? "貪欲法" : "Greedy"}
          picks={greedy}
          good={false}
          isJa={isJa}
        />
        <CoinPickRow
          label={isJa ? "DP（最適）" : "DP (optimal)"}
          picks={optimal}
          good={true}
          isJa={isJa}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {isJa
          ? "DP は «最初の 1 手を全通り試し、残りは同じ問題に帰着する» ので、この落とし穴にそもそもはまりません。逆に、交換論法などで «貪欲が最適» を証明できる問題では、DP は過剰です。"
          : "DP tries every first move and reduces the remainder to the same problem, so it avoids this trap structurally. Conversely, when an exchange argument proves greedy optimal, DP is overkill."}
      </p>
    </div>
  );
}
