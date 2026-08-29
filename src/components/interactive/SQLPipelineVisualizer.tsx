"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

type Layer = "frontend" | "planner" | "executor" | "storage";

type Stage = {
  id: string;
  layer: Layer;
  title: string;
  titleEn: string;
  artifactLabel: string;
  artifactLabelEn: string;
  artifact: string;
  note: string;
  noteEn: string;
};

const LAYER_META: Record<
  Layer,
  { ja: string; en: string; dot: string; chip: string }
> = {
  frontend: {
    ja: "フロントエンド",
    en: "Front end",
    dot: "bg-violet-500",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40",
  },
  planner: {
    ja: "プランナ",
    en: "Planner",
    dot: "bg-sky-500",
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  },
  executor: {
    ja: "エグゼキュータ",
    en: "Executor",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  },
  storage: {
    ja: "ストレージ",
    en: "Storage",
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  },
};

const STAGES: Stage[] = [
  {
    id: "sql",
    layer: "frontend",
    title: "SQL テキスト",
    titleEn: "SQL text",
    artifactLabel: "クライアントから届いたバイト列",
    artifactLabelEn: "Bytes received from the client",
    artifact: `SELECT u.name, o.total
FROM users AS u
JOIN orders AS o ON u.id = o.user_id
WHERE u.age > 30 AND o.total > 100
ORDER BY o.total DESC
LIMIT 10;`,
    note: "この時点ではただの文字列です。データベースにとっては users も u.age も意味を持たない文字の並びでしかありません。",
    noteEn:
      "At this point it is just a string. To the database, neither users nor u.age means anything yet — they are only sequences of characters.",
  },
  {
    id: "tokens",
    layer: "frontend",
    title: "字句解析（Lexer）",
    titleEn: "Lexing",
    artifactLabel: "トークン列",
    artifactLabelEn: "Token stream",
    artifact: `KEYWORD(SELECT) IDENT(u) PUNCT(.) IDENT(name) PUNCT(,)
IDENT(o) PUNCT(.) IDENT(total)
KEYWORD(FROM) IDENT(users) KEYWORD(AS) IDENT(u)
KEYWORD(JOIN) IDENT(orders) KEYWORD(AS) IDENT(o)
KEYWORD(ON) IDENT(u) PUNCT(.) IDENT(id) OP(=) IDENT(o) PUNCT(.) IDENT(user_id)
KEYWORD(WHERE) IDENT(u) PUNCT(.) IDENT(age) OP(>) NUMBER(30)
KEYWORD(AND) IDENT(o) PUNCT(.) IDENT(total) OP(>) NUMBER(100)
KEYWORD(ORDER) KEYWORD(BY) IDENT(o) PUNCT(.) IDENT(total) KEYWORD(DESC)
KEYWORD(LIMIT) NUMBER(10) PUNCT(;) EOF`,
    note: "最長一致（maximal munch）で文字を語彙単位に切り分けます。ここで初めて「>=」が1トークンなのか「>」と「=」なのかが決まります。",
    noteEn:
      "Characters are cut into lexemes using maximal munch. This is where it is decided whether >= is one token or > followed by =.",
  },
  {
    id: "ast",
    layer: "frontend",
    title: "構文解析（Parser）",
    titleEn: "Parsing",
    artifactLabel: "抽象構文木（AST）",
    artifactLabelEn: "Abstract syntax tree",
    artifact: `SelectStmt
├─ targets : [ ColRef(u.name), ColRef(o.total) ]
├─ from    : JoinExpr(INNER)
│            ├─ left  : RangeVar(users) AS u
│            ├─ right : RangeVar(orders) AS o
│            └─ on    : BinOp(=, ColRef(u.id), ColRef(o.user_id))
├─ where   : BoolExpr(AND)
│            ├─ BinOp(>, ColRef(u.age), Const(30))
│            └─ BinOp(>, ColRef(o.total), Const(100))
├─ orderBy : [ SortBy(ColRef(o.total), DESC) ]
└─ limit   : Const(10)`,
    note: "文法規則に従ってトークン列を木に組み上げます。AST は「書かれた通りの構造」であり、まだ意味は与えられていません。",
    noteEn:
      "Tokens are assembled into a tree according to the grammar. The AST mirrors what was written — no meaning has been attached yet.",
  },
  {
    id: "bind",
    layer: "frontend",
    title: "意味解析・束縛（Binder）",
    titleEn: "Binding / semantic analysis",
    artifactLabel: "カタログ解決済みの式",
    artifactLabelEn: "Catalog-resolved expressions",
    artifact: `catalog lookup
  users  → oid 16384  (id int4 #1, name text #2, age int4 #3)
  orders → oid 16390  (id int4 #1, user_id int4 #2, total numeric #3)

range table
  [1] users  AS u
  [2] orders AS o

resolved expressions
  u.name           → Var(1, 2) :: text
  o.total          → Var(2, 3) :: numeric
  u.id = o.user_id → OpExpr(int4eq,     Var(1,1), Var(2,2)) :: bool
  u.age > 30       → OpExpr(int4gt,     Var(1,3), Const(30::int4)) :: bool
  o.total > 100    → OpExpr(numeric_gt, Var(2,3), Const(100::numeric)) :: bool`,
    note: "名前が実体に結びつく工程です。存在しない列やあいまいな列名はここでエラーになり、演算子は型に応じた具体的な関数（int4gt / numeric_gt）へ解決されます。",
    noteEn:
      "This is where names become entities. Missing or ambiguous columns fail here, and operators resolve to concrete type-specific functions (int4gt / numeric_gt).",
  },
  {
    id: "logical",
    layer: "planner",
    title: "論理プラン生成",
    titleEn: "Logical plan",
    artifactLabel: "関係代数の演算子木",
    artifactLabelEn: "Relational-algebra operator tree",
    artifact: `Limit(10)
└─ Sort(o.total DESC)
   └─ Project(u.name, o.total)
      └─ Filter(u.age > 30 AND o.total > 100)
         └─ Join(u.id = o.user_id)
            ├─ Scan(users AS u)
            └─ Scan(orders AS o)`,
    note: "SQL の宣言的な記述を「何を計算するか」だけを表す関係代数の木に落とします。まだアルゴリズムは決まっていません。",
    noteEn:
      "The declarative SQL text becomes a relational-algebra tree that states only *what* to compute. No algorithm has been chosen yet.",
  },
  {
    id: "rewrite",
    layer: "planner",
    title: "書き換え・正規化",
    titleEn: "Rewrite / normalization",
    artifactLabel: "述語プッシュダウン後の論理プラン",
    artifactLabelEn: "Logical plan after predicate pushdown",
    artifact: `Limit(10)
└─ Sort(o.total DESC)
   └─ Project(u.name, o.total)
      └─ Join(u.id = o.user_id)
         ├─ Scan(users)   filter: age > 30     output: id, name
         └─ Scan(orders)  filter: total > 100  output: user_id, total

適用した規則
  · 述語プッシュダウン  : AND を分解し、各連言項を参照テーブル直上へ降ろす
  · 列プルーニング      : 上位で使われない列を読み出し対象から外す
  · 定数畳み込み        : now() のような安定関数をプラン時に1回だけ評価する
                          （このクエリには対象が無いので何も起きない）`,
    note: "結合前に行数を減らすほど後段は安くなります。AND を連言項に分解してから降ろすのが定石で、OR は分解できないため降ろせないことがあります。",
    noteEn:
      "The fewer rows that reach the join, the cheaper everything above it becomes. Splitting AND into conjuncts before pushing is the standard trick; OR cannot be split the same way and often stays put.",
  },
  {
    id: "stats",
    layer: "planner",
    title: "統計とカーディナリティ推定",
    titleEn: "Statistics & cardinality estimation",
    artifactLabel: "推定行数",
    artifactLabelEn: "Estimated row counts",
    artifact: `pg_class
  users  : reltuples =   100,000   relpages =  1,000
  orders : reltuples = 1,000,000   relpages = 10,000

pg_statistic
  users.age       histogram → sel(age > 30)    = 0.55
  orders.total    histogram → sel(total > 100) = 0.10
  users.id        n_distinct = -1 (unique)     → NDV = 100,000
  orders.user_id  n_distinct = 100,000

|σ(users)|  = 100,000 × 0.55 =  55,000
|σ(orders)| = 1,000,000 × 0.10 = 100,000
join sel    = 1 / max(NDV(u.id), NDV(o.user_id)) = 1 / 100,000
|u ⋈ o|     = 55,000 × 100,000 / 100,000 = 55,000`,
    note: "オプティマイザの品質はここで決まります。推定を誤ると、以降のコスト比較がどれだけ精密でも間違ったプランを選びます。",
    noteEn:
      "This step determines the optimizer's quality. If the estimate is wrong, no amount of precision in the later cost comparison will save the plan.",
  },
  {
    id: "cost",
    layer: "planner",
    title: "コストベース最適化",
    titleEn: "Cost-based optimization",
    artifactLabel: "候補プランのコスト比較",
    artifactLabelEn: "Candidate plan costs",
    artifact: `cost constants
  seq_page_cost 1.0   random_page_cost 4.0
  cpu_tuple_cost 0.01 cpu_operator_cost 0.0025 cpu_index_tuple_cost 0.005

scan costs
  SeqScan(users)  = 1,000×1.0 +   100,000×0.01 +   100,000×0.0025 =  2,250
  SeqScan(orders) = 10,000×1.0 + 1,000,000×0.01 + 1,000,000×0.0025 = 22,500

join candidates
  A NestedLoop (users × IndexScan orders_user_id_idx)
      2,250 + 55,000 × 48.175                   ≈ 2,651,875
  B MergeJoin (Sort(users), Sort(orders))
      6,580 + 30,805 + 938                      ≈    38,323
  C HashJoin  (build = users, probe = orders)   ★ 採用
      2,250 + 22,500 + 938                      ≈    25,688`,
    note: "同じ結果を返すプランの中から、コストモデルが最小と判断したものを選びます。ここで比較しているのは実行時間そのものではなく、あくまで見積もりです。",
    noteEn:
      "Among plans that all return the same result, the one the cost model scores lowest is chosen. What is compared here is an estimate — not actual runtime.",
  },
  {
    id: "physical",
    layer: "planner",
    title: "物理プラン確定",
    titleEn: "Physical plan",
    artifactLabel: "実行可能な演算子木",
    artifactLabelEn: "Executable operator tree",
    artifact: `Limit(10)                              rows=10       cost≈26,601
└─ Sort(o.total DESC) top-N heapsort   rows=10       cost≈26,601
   └─ HashJoin(u.id = o.user_id)       rows=55,000   cost≈25,688
      ├─ SeqScan(orders)               rows=100,000  cost≈22,500   [probe]
      │    Filter: total > 100
      └─ Hash                          rows=55,000
         └─ SeqScan(users)             rows=55,000   cost≈2,250    [build]
              Filter: age > 30`,
    note: "LIMIT 10 が付いているため、全件ソートではなく上位10件だけを保持する top-N heapsort が選ばれています。上位ノードの要求が下位のアルゴリズム選択を変える例です。",
    noteEn:
      "Because of LIMIT 10, a top-N heapsort that keeps only 10 rows is chosen instead of a full sort — an example of a parent node's requirement changing the algorithm below it.",
  },
  {
    id: "exec",
    layer: "executor",
    title: "実行（Volcano 反復子）",
    titleEn: "Execution (Volcano iterator)",
    artifactLabel: "open / next / close の呼び出し連鎖",
    artifactLabelEn: "open / next / close call chain",
    artifact: `ExecutorRun()
  Limit.next()
    Sort.next()                 ← 初回で入力を全部吸い上げる（blocking）
      HashJoin.next()
        build phase : Hash ← SeqScan(users).next() を NULL まで繰り返す
        probe phase : SeqScan(orders).next() を1タプルずつ

pull 型なので、必要な行だけが上へ流れる。
Limit が 10 行受け取った時点で next() の呼び出しは止まる。`,
    note: "各演算子は「親から next() を呼ばれたら1タプル返す」という同じインタフェースを実装します。これがあらゆる演算子を自由に組み合わせられる理由です。",
    noteEn:
      "Every operator implements the same interface: return one tuple when the parent calls next(). That uniformity is what lets any operator be composed with any other.",
  },
  {
    id: "am",
    layer: "storage",
    title: "アクセスメソッド",
    titleEn: "Access method",
    artifactLabel: "論理タプルから物理位置へ",
    artifactLabelEn: "From logical tuple to physical location",
    artifact: `SeqScan(orders).next()
  heap_getnext(scan, ForwardScanDirection)
    現在ブロック内のラインポインタを 1 つ進める
    ブロックを読み切ったら次のブロックへ  block = 0, 1, 2, …, 9,999

  可視性判定 : HeapTupleSatisfiesMVCC(tuple, snapshot)
    t_xmin がスナップショットから見てコミット済みか
    t_xmax が未設定 / 未コミットか

  → 見つかった行の物理位置 = TID (block, offset) = (4271, 58)`,
    note: "ここで論理的な「行」が物理的な位置（TID）に対応づきます。MVCC のもとでは、ページ上に存在する行がすべて自分から見えるわけではありません。",
    noteEn:
      "This is where a logical row maps to a physical location (a TID). Under MVCC, not every row present on a page is visible to your snapshot.",
  },
  {
    id: "buffer",
    layer: "storage",
    title: "バッファプール",
    titleEn: "Buffer pool",
    artifactLabel: "ページのキャッシュ管理",
    artifactLabelEn: "Page cache management",
    artifact: `ReadBuffer(orders, blockNum = 4271)
  BufTableLookup(tag = {db, relfilenode, fork = MAIN, block = 4271})

  HIT  → frame 118 を pin して返す（ディスク I/O なし）
  MISS → clock-sweep で犠牲フレームを選ぶ
           pin_count > 0  → 触れない
           usage_count > 0 → 1 減らして次へ
           usage_count = 0 → 犠牲に決定
         犠牲が dirty なら
           1. そのページの LSN まで WAL を flush   ← WAL 先行書き込み規則
           2. データページを書き出す
         smgrread() で 8KB を読み込む`,
    note: "実行エンジンはページを直接ディスクから読みません。必ずバッファプールを経由し、pin されている間はそのページが追い出されないことが保証されます。",
    noteEn:
      "The execution engine never reads a page straight from disk. Everything goes through the buffer pool, and while a page is pinned it is guaranteed not to be evicted.",
  },
  {
    id: "disk",
    layer: "storage",
    title: "ディスク I/O とページ解読",
    titleEn: "Disk I/O & page decoding",
    artifactLabel: "8192 バイトの中身",
    artifactLabelEn: "Inside the 8192 bytes",
    artifact: `pread(fd, buf, 8192, offset = 4271 × 8192 = 34,988,032)

buf[0 … 8191]
  +0     PageHeaderData (24B)   pd_lower = 396   pd_upper = 3120
  +24    ItemIdData[0 … 92]     4B each: (lp_off, lp_flags, lp_len)
   …     free space  (3120 − 396 = 2724 B)
  +3120  tuples, growing downward from the end of the page

ItemIdData[57] = (lp_off = 5384, lp_flags = LP_NORMAL, lp_len = 48)
  buf[5384 … 5431]
    HeapTupleHeader 23B : t_xmin, t_xmax, t_ctid, t_infomask, t_hoff
    NULL bitmap          : 列数ぶんのビット（NULL が無ければ省略される）
    column data          : id, user_id, total

heap_deform_tuple() → Datum[]{ id = 8842, user_id = 317, total = 250.00 }`,
    note: "ここが「物理」の底です。SQL という宣言的な文字列は、最終的に「ファイルのこのオフセットから 8192 バイト読み、そのうち 48 バイトを構造体として解釈する」という命令にまで還元されます。",
    noteEn:
      "This is the physical floor. A declarative SQL string is ultimately reduced to: read 8192 bytes at this file offset, then interpret 48 of them as a struct.",
  },
];

type Props = { locale?: string };

export function SQLPipelineVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const player = useStepPlayer({ totalSteps: STAGES.length, intervalMs: 2600 });
  const current = STAGES[player.step];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "SQL 1本がバイト列に届くまでの全工程"
          : "The Full Journey From One SQL Statement to Bytes"
      }
      description={
        isJa
          ? "同じ1本のクエリが、テキスト → トークン → AST → 論理プラン → 物理プラン → 実行 → ページ読み出しへと姿を変えていく様子を、各段階の中間表現とともに追跡します。"
          : "Follow a single query as it changes shape — text → tokens → AST → logical plan → physical plan → execution → page reads — with the intermediate representation shown at every stage."
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[210px_1fr]">
        {/* Stage rail */}
        <ol
          aria-label={isJa ? "処理工程" : "Pipeline stages"}
          className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {STAGES.map((s, idx) => {
            const active = idx === player.step;
            const done = idx < player.step;
            const meta = LAYER_META[s.layer];
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => player.goTo(idx)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? "bg-accent/15 font-semibold text-foreground ring-1 ring-accent/40"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${meta.dot} ${active || done ? "" : "opacity-40"}`}
                  />
                  <span className="whitespace-nowrap lg:whitespace-normal">
                    <span className="sr-only">
                      {isJa ? meta.ja : meta.en} —{" "}
                    </span>
                    {isJa ? s.title : s.titleEn}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Artifact panel */}
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${LAYER_META[current.layer].chip}`}
            >
              {isJa
                ? LAYER_META[current.layer].ja
                : LAYER_META[current.layer].en}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {isJa ? current.title : current.titleEn}
            </span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {player.step + 1} / {STAGES.length}
            </span>
          </div>

          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? current.artifactLabel : current.artifactLabelEn}
            </div>
            <pre className="max-h-[22rem] overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground sm:text-xs">
              {current.artifact}
            </pre>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {isJa ? current.note : current.noteEn}
          </p>

          <StepPlayerControls
            {...player}
            ariaLabels={stepPlayerAriaLabels(locale)}
          />
        </div>
      </div>
    </InteractiveDemo>
  );
}
