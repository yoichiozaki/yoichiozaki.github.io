/**
 * The chain from capital to FCF (§2.1) on the capability map: the money links
 * along the top, the arrows between them, and the link numbers shown as badges.
 * Links 2–6 are the map's own resources, training, model, inference and uses.
 */
import { SOURCES as S } from "./capability-map-sources";
import { item, t, type EdgeDef, type GroupDef, type NodeDef } from "./capability-map-types";

/** Link numbers from §2.1, shown as badges on the boxes that stand for each link. */
export const CHAIN_LINK: Readonly<Record<string, number>> = {
  capital: 1,
  resources: 2,
  training: 3,
  model: 4,
  inference: 5,
  uses: 6,
  revenue: 7,
  "gross-profit": 8,
  "operating-profit": 9,
  fcf: 10,
};

export const CAPITAL: GroupDef = {
  kind: "group",
  id: "capital",
  category: "money",
  layout: "column",
  label: t("資本調達", "Capital raising"),
  detail: {
    summary: t(
      "チェーンの入口。株式、転換社債、借入、リース、取引先からの融資などで、計算資源を確保するためのお金を集める。",
      "The entrance of the chain: raising the money to secure compute through equity, convertible notes, debt, leases and financing from suppliers.",
    ),
    note: t(
      "次の巨額の資本を集める条件は、能力への期待から、ユニットエコノミクスの証明に移った。1 回の調達額は数百億ドルを超え、それを出せる相手は限られる。Anthropic の財務キャッシュフローは 2023 年の 23 億ドルから 2026 年上期の 1,108 億ドルに増えたが、OpenAI の 10 月の調達は、当初目標の 300 億ドルに対して約 110 億ドルにとどまった（報道）。",
      "The condition for raising the next round has shifted from expectations about capability to proof of unit economics. Single raises now run to tens of billions of dollars, and few parties can supply that much. Anthropic's financing cash flow grew from USD 2.3 billion in 2023 to USD 110.8 billion in H1 2026, while OpenAI's October round raised about USD 11 billion against an initial target of USD 30 billion (reported).",
    ),
    refs: ["2.1:link1", "6.2:market", "2.2:valuation", "2.2:vendor", "2.3:openai"],
    links: [S.s1, S.wsj, S.decoderOpenAI, S.cnbcRound],
  },
  children: [
    item("ocf", t("営業キャッシュフロー", "Operating cash flow"), {
      summary: t(
        "本業が生む現金。外部に頼らずに投資を続けられるかを決める。",
        "Cash from the core business; it decides whether investment can continue without outside money.",
      ),
      note: t(
        "Microsoft の 2026 会計年度の営業キャッシュフローは 1,829 億ドル。設備投資 1,159 億ドルを払っても FCF が残る。ただし、営業キャッシュフローのうち FCF として残る割合は 2023 会計年度の 68% から 37% に下がり、Amazon（過去 12 か月）と Alphabet（2026 年 1〜9 月）では設備投資が営業キャッシュフローを上回った。",
        "Microsoft's operating cash flow in fiscal 2026 was USD 182.9 billion, leaving FCF even after USD 115.9 billion of capex. But the share of operating cash flow left as FCF fell from 68% in fiscal 2023 to 37%, and at Amazon (trailing twelve months) and Alphabet (January–September 2026) capex exceeded operating cash flow.",
      ),
      refs: ["7.1:selfFunded", "3.5", "7.3:weakness"],
      links: [S.msft10k, S.msft10q],
    }),
    item("external-capital", t("出資・上場・借入", "Equity, IPOs and debt"), {
      summary: t("外から集める資金。", "Money raised from outside."),
      note: t(
        "Anthropic は 2026 年上期に 1,100 億ドル超を調達した。OpenAI の 10 月の調達は目標に届かず（報道）、Alphabet は株式と借入に、Amazon は借入に頼り始めた。",
        "Anthropic raised more than USD 110 billion in H1 2026. OpenAI's October round fell short of its target (reported), while Alphabet has turned to equity and debt, and Amazon to debt.",
      ),
      refs: ["3.5", "6.2:lenders", "2.2:vendor"],
      links: [S.wsj, S.decoderOpenAI, S.cnbcRound, S.s1, S.goog10q, S.amzn10q],
    }),
    item("contracts", t("長期契約・リース", "Contracts and leases"), {
      summary: t(
        "何年も先まで計算資源を押さえる契約。前払いは軽くなるが、長い支払い義務を負う。",
        "Contracts that lock in compute for years: less cash up front, but long payment obligations.",
      ),
      note: t(
        "Anthropic の S-1 で名前の挙がった契約だけで、上限値を含めて 6,000 億ドルを超える。Microsoft の開始前のリースは 3,646 億ドル。",
        "The agreements named in Anthropic's S-1 alone exceed USD 600 billion, including upper-bound amounts; Microsoft's leases not yet commenced total USD 364.6 billion.",
      ),
      refs: ["2.2:contracts", "2.3", "7.1:leases"],
      links: [S.s1, S.msft10q],
    }),
  ],
};

export const REVENUE: NodeDef = {
  kind: "node",
  id: "revenue",
  category: "money",
  label: t("売上", "Revenue"),
  sublabel: t("計算資源の費用を上回るか", "Above compute cost?"),
  detail: {
    summary: t(
      "完了した仕事に顧客が払う対価。従量課金とサブスクリプションからなる。",
      "What customers pay for the work that gets done, through usage billing and subscriptions.",
    ),
    note: t(
      "2023 年の生成 AI の売上は、チャットのサブスクリプションと試験的な API 利用が中心だった。2026 年の Anthropic では、トークン量に応じた従量課金が上期の売上の 80% を占め、売上は 2023 年通期の 4,100 万ドルから 2026 年上期の 162.9 億ドルになった。計算資源 1 ドルあたりの売上は、2023 年の 0.09 から 2026 年上期の 1.82 に上がった（7〜9 月期は報道で 1.70）。",
      "In 2023, generative AI revenue came mainly from chat subscriptions and experimental API use. At Anthropic in 2026, token-metered usage billing made up 80% of first-half revenue, and revenue grew from USD 41 million in 2023 to USD 16.29 billion in H1 2026. Revenue per dollar of compute rose from 0.09 in 2023 to 1.82 in H1 2026 (1.70 in July–September, as reported).",
    ),
    refs: ["2.1:link7", "2.2:payg", "6.3:revenuePerCompute", "8:growth"],
    links: [S.s1, S.decoderAnthropic],
  },
};

export const GROSS_PROFIT: NodeDef = {
  kind: "node",
  id: "gross-profit",
  category: "money",
  label: t("粗利", "Gross profit"),
  sublabel: t("価格競争の下でも残るか", "Survives price competition?"),
  detail: {
    summary: t(
      "売上から、顧客向けの推論にかかる費用（売上原価）を引いた残り。",
      "Revenue minus the cost of serving customers' inference (cost of revenue).",
    ),
    note: t(
      "Anthropic の粗利率は 2023 年の 37% から、2024 年の −95% を経て、2026 年上期に 85% になった。OpenAI は 2025 年に約 33%（報道）。85% は、需要が供給を上回り、計算資源の単価が過去の契約で固定されていた時期の数字である。",
      "Anthropic's gross margin went from 37% in 2023, through −95% in 2024, to 85% in H1 2026; OpenAI's was about 33% in 2025 (reported). The 85% comes from a period when demand exceeded supply and compute prices were fixed by earlier contracts.",
    ),
    refs: ["2.1:link8", "6.3:margin", "2.2:margin"],
    links: [S.s1],
  },
};

export const OPERATING_PROFIT: NodeDef = {
  kind: "node",
  id: "operating-profit",
  category: "money",
  label: t("営業利益", "Operating profit"),
  sublabel: t("学習費を回収できるか", "Training cost recovered?"),
  detail: {
    summary: t(
      "粗利から、学習・研究の計算資源費、人件費、営業費を引いた残り。",
      "Gross profit minus compute for training and research, personnel and sales costs.",
    ),
    note: t(
      "Anthropic の営業利益率は 2023 年の −1,344% から 2026 年上期の −4% に改善し、4〜6 月期は 9.7 億ドルの黒字だった。OpenAI の営業損益は、2026 年上期に約 −216 億ドルだった（報道）。",
      "Anthropic's operating margin improved from −1,344% in 2023 to −4% in H1 2026, with a USD 0.97 billion profit in April–June. OpenAI's operating loss in H1 2026 was about USD 21.6 billion (reported).",
    ),
    refs: ["2.1:link9", "6.3:training", "2.2:operating"],
    links: [S.s1],
  },
};

export const FCF: NodeDef = {
  kind: "node",
  id: "fcf",
  category: "money",
  label: t("FCF", "FCF"),
  sublabel: t("設備投資のあとに残るか", "Cash left after capex?"),
  emphasis: true,
  detail: {
    summary: t(
      "営業キャッシュフローから設備投資（とリースの元本返済）を引いたもの。次の資本をどんな条件で集められるかを決める。",
      "Operating cash flow minus capex (and lease principal repayments); it sets the terms on which the next round of capital can be raised.",
    ),
    note: t(
      "Anthropic の FCF は 2023 年の −16.3 億ドルから 2026 年上期の +34.5 億ドルになった。ただし、自社設備とリースへの移行で、設備投資とリースの支払いはこれから大きく増える。OpenAI は、2026〜2030 年の累計で約 2,800 億ドルの現金流出を見込み、手元資金は 2028 年に尽きる想定だと報じられている。",
      "Anthropic's FCF went from −USD 1.63 billion in 2023 to +USD 3.45 billion in H1 2026, but capex and lease payments are about to rise sharply as it moves to its own facilities and leases. OpenAI reportedly projects about USD 280 billion of cumulative cash outflow over 2026–2030, with its cash running out in 2028.",
    ),
    refs: ["2.1:link10", "2.2:finance", "2.2:leasePrincipal"],
    links: [S.s1],
  },
};

const DEDUCTED = t("差し引く費用", "Cost deducted");

/** The arrows that carry money, in the order of the chain: 1 → 2, 6 → 7, 7 → 8, 8 → 9, 9 → 10 and 10 → 1. */
export const CHAIN_EDGES: EdgeDef[] = [
  {
    id: "chain-capital",
    from: "capital",
    to: "resources",
    fromSide: "bottom",
    toSide: "top",
    kind: "money",
    label: t("長期の支払い義務", "Long-term commitments"),
    kicker: t("計算資源に変える", "Into compute"),
    detail: {
      summary: t(
        "集めた資本で、クラウド契約、チップのリース、自社のデータセンターを押さえる。2023 年の制約は GPU が手に入らないことだった。2026 年の Anthropic の S-1 が描くのは、計算資源を 12〜18 か月前に契約し、何年も先まで払う仕組みである。",
        "The capital raised secures compute through cloud contracts, chip leases and own data centres. In 2023 the constraint was getting GPUs at all; what Anthropic's 2026 S-1 describes is compute contracted 12–18 months ahead and paid for over many years.",
      ),
      note: t(
        "支払い義務は 5〜20 年続くのに対し、売上が入ってくる期間は月単位から数年単位である。投資家が知りたいのは、需要が想定の半分だったら、どれだけの固定費が残るかである。",
        "Payment obligations run 5–20 years, while revenue comes in over months to a few years. What investors want to know is how much fixed cost would remain if demand came in at half the plan.",
      ),
      refs: ["2.1:link2", "2.3:timing", "6.3:obligations"],
      links: [S.s1, S.msft10q],
    },
  },
  {
    id: "chain-revenue",
    from: "uses",
    to: "revenue",
    fromSide: "right",
    toSide: "right",
    kind: "money",
    lane: "right",
    label: t("価格", "Price"),
    kicker: t("売上に変える", "Into revenue"),
    detail: {
      summary: t(
        "完了した仕事に、顧客がいくら払うか。同じ能力は急速に安くなり、最先端の能力はむしろ高くなっている。",
        "What customers pay for the work that gets done. The same capability gets cheap fast, while frontier capability gets more expensive.",
      ),
      note: t(
        "同じ性能あたりの価格は年 5〜10 倍のペースで下がり、最新のフロンティアモデルを動かす価格は年 3〜18 倍のペースで上がっている（MIT FutureTech の推計）。売上の伸びは、値下げのあとに利用量がどれだけ増えるかと、最先端の能力に上乗せの対価が付くかに左右される。",
        "The price of a given level of performance has fallen 5–10x a year, while the price of running the newest frontier models has risen 3–18x a year (MIT FutureTech estimates). Revenue growth turns on how much usage rises after price cuts and on whether frontier capability earns a premium.",
      ),
      refs: ["5.2:price", "3.2:volume", "6.3:demand"],
      links: [S.priceOfProgress, S.s1],
    },
  },
  {
    id: "chain-gross",
    from: "revenue",
    to: "gross-profit",
    fromSide: "left",
    toSide: "right",
    kind: "money",
    ties: ["inference"],
    label: t("−\u00a0推論費", "−\u00a0Inference cost"),
    kicker: DEDUCTED,
    detail: {
      summary: t(
        "顧客向けの推論にかかる計算資源費で、環 5（推論の供給）の費用にあたる。推論時計算やハーネスで 1 件の仕事に使うトークンが増えるほど、ここが大きくなる。",
        "The compute cost of serving customers' inference — the cost of link 5 (inference supply). The more tokens inference-time compute and the harness spend on each job, the larger it gets.",
      ),
      note: t(
        "Anthropic では、2024 年に顧客向け推論のコストが売上の 2 倍近くあったが、2026 年上期には売上の 15% まで下がった。ただし、無料ユーザーへの推論のコストと、販売パートナーへの手数料は、売上原価ではなく販売・マーケティング費に分類されている。",
        "At Anthropic, the cost of serving customers was nearly twice revenue in 2024 but down to 15% of revenue in H1 2026. The cost of inference for free users and the fees paid to sales partners, however, are classified as sales and marketing expenses, not cost of revenue.",
      ),
      refs: ["2.2:inferenceCost", "5.2:chainCosts", "6.3:margin"],
      links: [S.s1],
    },
  },
  {
    id: "chain-operating",
    from: "gross-profit",
    to: "operating-profit",
    fromSide: "left",
    toSide: "right",
    kind: "money",
    ties: ["training"],
    label: t("−\u00a0学習・研究費など", "−\u00a0Training, research, etc."),
    kicker: DEDUCTED,
    detail: {
      summary: t(
        "学習と研究の計算資源費（環 3 の費用）、人件費、営業費。学習の費用は前払いで、モデルが売れる期間のうちに回収するしかない。",
        "Compute for training and research (the cost of link 3), personnel and sales costs. Training is paid for up front and has to be recovered while the model sells.",
      ),
      note: t(
        "Anthropic の 2026 年上期の研究開発費は 97 億ドルで、売上の 60% にあたる。7〜9 月期の売上の 80% 超が直前 6 か月に出たモデルによるという S-1 の数字は、1 つのモデルが売上の中心にいる期間が、半年から 1 年ほどしかないことを示唆している。",
        "Anthropic's R&D in H1 2026 was USD 9.7 billion, or 60% of revenue. The S-1's figure that more than 80% of July–September revenue came from models released in the previous six months suggests that a model stays at the centre of revenue for only about six months to a year.",
      ),
      refs: ["2.2:rd", "5.2:chainCosts", "6.3:training", "5.3:recover"],
      links: [S.s1],
    },
  },
  {
    id: "chain-fcf",
    from: "operating-profit",
    to: "fcf",
    fromSide: "left",
    toSide: "right",
    kind: "money",
    ties: ["resources"],
    label: t("−\u00a0設備投資など", "−\u00a0Capex, etc."),
    kicker: DEDUCTED,
    detail: {
      summary: t(
        "設備投資（環 2 の費用）、運転資本の増加、税金など。リースで計算資源を持つなら、リースの元本返済も引いて見る必要がある。",
        "Capex (the cost of link 2), the increase in working capital, taxes and so on. Where compute is held through leases, lease principal repayments need to be subtracted too.",
      ),
      note: t(
        "計算資源をクラウドの利用料として払えば、その支出は営業キャッシュフローから出ていく。ファイナンスリースに置き換えると、賃料の元本部分は財務キャッシュフローに入るので、営業キャッシュフロー − 設備投資で計算した FCF にはほとんど表れない。Anthropic の Broadcom とのリースだけで、賃料総額は約 1,612 億ドルにのぼる。",
        "Paid as cloud fees, compute spending leaves through operating cash flow. Under a finance lease, the principal portion of the rent goes to financing cash flow instead, so it barely shows up in FCF computed as operating cash flow minus capex. Anthropic's Broadcom leases alone carry about USD 161.2 billion of total rent.",
      ),
      refs: ["2.2:leasePrincipal", "2.2:finance", "7.1:leases"],
      links: [S.s1, S.msft10q],
    },
  },
  {
    id: "chain-next",
    from: "fcf",
    to: "capital",
    fromSide: "left",
    toSide: "right",
    kind: "money",
    label: t("次の調達の条件", "Terms of the next raise"),
    kicker: t("次の資本へ", "Into the next round"),
    detail: {
      summary: t(
        "FCF とその見通しが、次の資本をどんな条件で集められるかを決める。FCF がマイナスの間は、その分を外部の資本で埋める。",
        "FCF and its outlook set the terms on which the next round of capital can be raised; while FCF is negative, outside capital fills the gap.",
      ),
      note: t(
        "2023 年の資本は、将来の能力への前払いだった。2026 年に資本の出し手が見ているのは、成長率の高さではなく、成長率の変化とユニットエコノミクスである。示すべきことは、計算資源 1 ドルあたりの売上、推論の粗利、需要の裏づけ、支払い義務と売上の期間の釣り合い、学習投資の回収の 5 つにまとめられる（第 6.3 節）。",
        "In 2023, capital was a prepayment for future capability. In 2026, providers of capital look not at how high growth is but at how it is changing and at unit economics. What a lab has to show comes down to five things: revenue per dollar of compute, gross margin on inference, backing for demand, a match between the duration of obligations and of revenue, and recovery of the investment in training (Section 6.3).",
      ),
      refs: ["2.1:link10", "6.2:market", "2.3:openai"],
      links: [S.wsj, S.s1],
    },
  },
];
