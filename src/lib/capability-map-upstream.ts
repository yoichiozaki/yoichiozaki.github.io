import { SOURCES as S } from "./capability-map-sources";
import { item, sub, t, type GroupDef, type NodeDef } from "./capability-map-types";

export const RESOURCES: GroupDef = {
  kind: "group",
  id: "resources",
  category: "resource",
  layout: "column",
  label: t("上流の資源", "Upstream resources"),
  detail: {
    summary: t(
      "計算資源のもとになるもの。資金、チップ、電力と用地、それらを動かす運用からなる。",
      "What compute is built from: money, chips, power and sites, and the operations that keep them running.",
    ),
    note: t(
      "2023 年の制約は GPU と CoWoS だったが、2026 年には電力、HBM、データセンター、資本に移った。どれも増強に年単位の時間がかかり、確保するための支払い義務は売上より何年も先行する。",
      "The binding constraints moved from GPUs and CoWoS in 2023 to power, HBM, data centres and capital in 2026. All take years to expand, and the obligations taken on to secure them run years ahead of revenue.",
    ),
    refs: ["4.7:outside", "2.3", "2.2:finance"],
    links: [S.epochDataCenters, S.iea, S.s1],
  },
  children: [
    sub(
      "funding",
      t("資金", "Funding"),
      {
        summary: t("計算資源を買ったり借りたりするためのお金。", "Money to buy or rent compute."),
        note: t(
          "次の巨額の資本を集める条件は、能力への期待からユニットエコノミクスの証明に移った。1 回の調達額は数百億ドルを超え、それを出せる相手は限られる。計算資源を売るハイパースケーラー自身も、外部資本に頼り始めた。",
          "The condition for raising the next round has shifted from expectations about capability to proof of unit economics. Single raises now run to tens of billions of dollars, few parties can supply that much, and the hyperscalers selling the compute have begun to rely on outside capital themselves.",
        ),
        refs: ["3.5", "6.2:market", "6.3:revenuePerCompute"],
        links: [S.wsj, S.s1, S.goog10q],
      },
      [
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
    ]),
    sub(
      "chips",
      t("チップ", "Chips"),
      {
        summary: t(
          "計算量の元になるチップ。性能は、プロセス、メモリ、パッケージ、数値精度、相互接続で決まる。",
          "The chips compute comes from; their performance depends on process, memory, packaging, precision and interconnect.",
        ),
        refs: ["4.3:gains"],
        links: [S.nvidiaRubin, S.epochScaling],
      },
      [
        item("process", t("プロセス（微細化）", "Process nodes"), {
          summary: t("同じ面積により多くのトランジスタを載せる。", "Fitting more transistors into the same area."),
          note: t(
            "H100 から Rubin までの性能の伸びのうち、プロセスの寄与は意外に小さい。TSMC の次の A16 でも、同じ電圧での速度の向上は N2P 比で 8〜10% にとどまる。",
            "Process contributed surprisingly little to the gains from H100 to Rubin; TSMC's next node, A16, is only 8–10% faster than N2P at the same voltage.",
          ),
          refs: ["4.3:gains", "4.3:next"],
          links: [S.trendforceTsmc, S.tsmcA16],
        }),
        item("hbm", t("メモリ（HBM）", "Memory (HBM)"), {
          summary: t(
            "演算器にデータを送るメモリの帯域と容量。推論の速さを決めることが多い。",
            "Bandwidth and capacity of the memory feeding the compute units; it often sets inference speed.",
          ),
          note: t(
            "1 チップあたりの帯域は H100 の 3.35 TB/s から Rubin の 19.2 TB/s へ広がった。SK hynix は 2026 年 10 月の決算説明会で、2029 年まで実質的に売り切れていると説明した。",
            "Per-chip bandwidth went from 3.35 TB/s (H100) to 19.2 TB/s (Rubin); on its October 2026 earnings call, SK hynix said it is effectively sold out through 2029.",
          ),
          refs: ["4.4:soldOut"],
          links: [S.memoryWall, S.nvidiaRubin, S.wccftechHbm, S.wccftechStatement],
        }),
        item("packaging", t("先端パッケージ", "Advanced packaging"), {
          summary: t("複数のダイと HBM を 1 つにまとめる技術（CoWoS など）。", "Combining several dies and HBM stacks into one package (CoWoS and others)."),
          note: t(
            "CoWoS はレチクル限界の 5.5 倍の大きさまで量産に入った。TSMC は 2028 年に 14 倍、2029 年にはそれ以上を計画している。",
            "TSMC is producing CoWoS at 5.5 times the reticle limit and plans 14 times for 2028, and more in 2029.",
          ),
          refs: ["4.5", "4.3:next"],
          links: [S.tsmcCowos, S.tsmcSymposium2026],
        }),
        item("precision", t("数値精度（低精度化）", "Numeric precision"), {
          summary: t(
            "数値のビット数を減らし、同じ回路と電力でより多く計算する。",
            "Using fewer bits per number to compute more with the same circuits and power.",
          ),
          note: t(
            "学習の手順を公開している開発元では、学習は BF16 から FP8 へ、推論は FP4 へ移った。4 ビットより下げる余地は小さい。",
            "Among developers that publish their recipes, training moved from BF16 to FP8 and inference to FP4; little room is left below 4 bits.",
          ),
          refs: ["4.2:returns"],
          links: [S.deepseekV3, S.nvfp4, S.precisionLaws, S.gptOss],
        }),
        item("interconnect", t("相互接続", "Interconnect"), {
          summary: t(
            "チップどうしを高速につなぐ。MoE と大規模な学習の効率を左右する。",
            "Fast links between chips; they shape the efficiency of MoE and large training runs.",
          ),
          note: t(
            "GB200 NVL72 は 72 基の GPU を 1 つの NVLink の領域につなぎ、TPU v7 は 9,216 チップを 1 つのポッドにまとめる。",
            "GB200 NVL72 joins 72 GPUs in one NVLink domain; TPU v7 puts 9,216 chips in one pod.",
          ),
          refs: ["4.5:interconnect", "4.6:shape"],
          links: [S.nvidiaGb200, S.ironwood, S.deepseekV3],
        }),
      ],
    ),
    sub(
      "power-sites",
      t("電力・用地", "Power and sites"),
      {
        summary: t("データセンターを動かす電力と、建てる場所。", "The power to run data centres and the land to build them on."),
        refs: ["4.1"],
        links: [S.epochDataCenters, S.epochPower, S.iea],
      },
      [
        item("grid", t("電力（発電・系統接続）", "Power and grid"), {
          summary: t("発電所と、系統への接続。2026 年の最大の制約の 1 つ。", "Generation and grid connections — one of the biggest constraints in 2026."),
          note: t(
            "1 つのサイトの規模が GW 単位になった。GE Vernova のガスタービンは 2031 年まで受注で埋まっていると報じられている。すぐに効く手は需要側の柔軟性で、新しい大口需要が年間の電力使用の 0.25〜1% にあたる抑制を受け入れれば、米国の既存の系統に 76〜126 GW をつなげるという試算がある（Duke 大学）。",
            "Single sites are now measured in gigawatts; GE Vernova's gas turbines are reportedly booked through 2031. The quick lever is demand flexibility: if new large loads accept curtailment of 0.25–1% of their annual use, the existing U.S. grid could take on 76–126 GW more (Duke University).",
          ),
          refs: ["4.1", "4.1:flex"],
          links: [S.epochDataCenters, S.iea, S.lbnl, S.duke, S.googleFlexible],
        }),
        item("cooling", t("冷却・水", "Cooling and water"), {
          summary: t(
            "ラックの電力が増えるほど、液冷が欠かせなくなる。熱を水の蒸発で捨てる方式では、水も大量に使う。",
            "The more power per rack, the more essential liquid cooling becomes; where heat is rejected by evaporating water, cooling also uses a lot of water.",
          ),
          note: t(
            "1 ラックの電力は、GB200 NVL72 の約 120〜130 kW から Vera Rubin NVL72 の約 190〜230 kW（TrendForce の推計）に増えた。水については、GPT-3 の学習で Microsoft の米国のデータセンターが約 70 万リットルの淡水を直接蒸発させたという推計がある（Li ら）。",
            "Rack power rose from about 120–130 kW (GB200 NVL72) to about 190–230 kW (Vera Rubin NVL72, TrendForce estimate). On water, Li et al. estimate that training GPT-3 in Microsoft's U.S. data centres could directly evaporate about 700,000 litres of fresh water.",
          ),
          refs: ["4.1:cooling"],
          links: [S.nvidia800v, S.thirsty, S.lbnl],
        }),
        item("permits", t("建設・許認可", "Construction and permits"), {
          summary: t("建屋、変圧器、許認可。お金を積んでもあまり早められない。", "Buildings, transformers and permits — money cannot speed them up much."),
          note: t(
            "大型変圧器の納期は 30〜36 か月に延びたと報じられている。地元の反対や、電気料金を巡る政治も制約になる。",
            "Lead times for large transformers have reportedly stretched to 30–36 months; local opposition and electricity-price politics also constrain building.",
          ),
          refs: ["4.1"],
          links: [S.iea, S.epochDataCenters],
        }),
      ],
    ),
    sub(
      "operations",
      t("運用", "Operations"),
      {
        summary: t("手に入れた計算資源を、どれだけ無駄なく動かせるか。", "How efficiently the compute you have is actually run."),
        refs: ["4.7:tokens"],
        links: [S.metaLlama4, S.llama3],
      },
      [
        item("utilization", t("稼働率", "Utilization"), {
          summary: t(
            "契約した計算資源を遊ばせずに使えている割合。固定費の回収を左右する。",
            "How much of the contracted compute is kept busy; it decides how much of the fixed cost is recovered.",
          ),
          note: t(
            "Anthropic の粗利率 85%（2026 年上期）は、需要が供給を上回り、稼働率が高かった時期の数字である。",
            "Anthropic's 85% gross margin in H1 2026 comes from a period when demand exceeded supply and utilization was high.",
          ),
          refs: ["2.2:margin"],
          links: [S.s1, S.decoderAnthropic],
        }),
        item("mfu", t("FLOP 利用率（MFU）", "MFU (FLOP utilization)"), {
          summary: t("チップの理論性能のうち、学習で実際に引き出せた割合。", "The share of a chip's peak performance actually used in training."),
          note: t(
            "Meta は Llama 3 の事前学習（最大 1.6 万基の H100、BF16）で、GPU 1 基あたり 380〜430 TFLOPS、MFU にして 38〜43% を報告した。精度を下げると理論性能が上がるので、同じ TFLOPS でも MFU は低く出る。",
            "Meta reported 380–430 TFLOPS per GPU — 38–43% MFU — for Llama 3 pretraining on up to 16,000 H100s in BF16. Lower precision raises the peak, so the same TFLOPS means a lower MFU.",
          ),
          refs: ["4.2:llama4"],
          links: [S.llama3, S.metaLlama4, S.palm],
        }),
        item("recovery", t("故障からの再開", "Recovery from failures"), {
          summary: t(
            "数万基を使う学習では、故障は日常的に起きる。途中の状態を保存してすぐに再開できるかが、実際に使える計算量を決める。",
            "In runs on tens of thousands of chips, failures are routine; saving state and restarting quickly decides how much compute is actually usable.",
          ),
          note: t(
            "Meta は、最大 1.6 万基の H100 を使った Llama 3 の事前学習で、54 日間に 466 回の中断があり、そのうち 419 回は予期しないものだったと報告した。Google DeepMind の Decoupled DiLoCo は、学習を独立した計算の「島」に分けて非同期に進め、1 つの島が止まってもほかの島が学習を続けられるようにした。",
            "Meta reported 466 job interruptions in a 54-day stretch of Llama 3 pretraining on up to 16,000 H100s, 419 of them unexpected. Google DeepMind's Decoupled DiLoCo splits a run into asynchronous islands of compute, so the other islands keep training when one goes down.",
          ),
          refs: ["4.1:distributed"],
          links: [S.llama3, S.diloco],
        }),
      ],
    ),
  ],
};

export const COMPUTE: NodeDef = {
  kind: "node",
  id: "compute",
  category: "compute",
  label: t("計算量", "Compute"),
  sublabel: t("学習と推論に使える FLOP", "FLOP for training and inference"),
  detail: {
    summary: t("資源から得られる計算量。", "The compute obtained from those resources."),
    note: t(
      "GPT-4 の学習は約 2.1 × 10²⁵ FLOP、GPT-6 Astra は約 9.4 × 10²⁶ FLOP（Epoch AI の推計）。2030 年までに 2 × 10²⁹ FLOP の学習が技術的に可能だという分析もある。",
      "GPT-4 was trained with about 2.1 × 10²⁵ FLOP and GPT-6 Astra with about 9.4 × 10²⁶ FLOP (Epoch AI estimates); one analysis finds a 2 × 10²⁹ FLOP run technically feasible by 2030.",
    ),
    refs: ["5.1", "5.2:slowing"],
    links: [S.epochModels, S.epochScaling, S.epochPower],
  },
};

export const SIZE: GroupDef = {
  kind: "group",
  id: "size",
  category: "size",
  layout: "column",
  label: t("モデルの大きさ", "Model size"),
  detail: {
    summary: t(
      "モデルが蓄えられる知識の量と、1 回に扱える情報の量。",
      "How much knowledge a model can hold and how much information it can take in at once.",
    ),
    refs: ["4.6:moe"],
    links: [S.chinchilla, S.fineGrainedMoe],
  },
  children: [
    item("params", t("パラメータ数（総数）", "Total parameters"), {
      summary: t("モデルが持つパラメータの総数。知識を蓄える容量に近い。", "All of a model's parameters — roughly its capacity to store knowledge."),
      note: t(
        "Kimi K2 の総パラメータは 1 兆（1 トークンあたりの稼働は 320 億）。OpenAI、Anthropic、xAI の非公開モデルはパラメータ数も構造も公表しておらず、Google も疎の MoE であることしか明かしていない。",
        "Kimi K2 has 1 trillion parameters in total (32 billion active per token). OpenAI's, Anthropic's and xAI's closed models disclose neither parameter counts nor architecture; Google says only that its models are sparse MoEs.",
      ),
      refs: ["4.6:moe"],
      links: [S.kimiK2, S.kaplan],
    }),
    item("active", t("稼働パラメータ（MoE）", "Active params (MoE)"), {
      summary: t("1 トークンの計算に実際に使うパラメータ。少ないほど推論は安い。", "Parameters actually used per token; fewer means cheaper inference."),
      note: t(
        "総数と稼働数の比は、Mixtral の 3.6 倍から Kimi K2 の 31 倍に広がった。",
        "The ratio of total to active parameters grew from 3.6x (Mixtral) to 31x (Kimi K2).",
      ),
      refs: ["4.6:moe"],
      links: [S.mixtral, S.fineGrainedMoe, S.deepseekV3, S.kimiK2],
    }),
    item("context", t("文脈の長さ", "Context length"), {
      summary: t(
        "1 回の呼び出しで参照できる情報の量。長いほど KV キャッシュと HBM の負担が増える。",
        "How much a single call can attend to; longer contexts weigh on the KV cache and HBM.",
      ),
      note: t(
        "GPT-4 Turbo（2023 年 11 月）の 12 万 8,000 トークンから、Claude Opus 4.6 の 100 万トークン（2026 年 3 月に通常の価格で提供）まで伸びた。DeepSeek の MLA は KV キャッシュを 93% 削り、DSA は重要な 2,048 トークンだけを選んでアテンションを計算する。",
        "It grew from 128,000 tokens for GPT-4 Turbo (November 2023) to 1 million for Claude Opus 4.6 (offered at standard prices from March 2026). DeepSeek's MLA cuts the KV cache by 93%, and DSA attends only to the 2,048 most relevant tokens.",
      ),
      refs: ["4.4:kvCache", "5.2:contextWindow"],
      links: [S.claude1m, S.deepseekV2, S.deepseekV32, S.minimax],
    }),
  ],
};

export const STAGES: GroupDef = {
  kind: "group",
  id: "stages",
  category: "stage",
  layout: "column",
  label: t("計算を使う段階", "Where compute is spent"),
  detail: {
    summary: t(
      "計算量を、モデルをつくる学習と、モデルを動かす推論に振り分ける。",
      "Compute is split between training, which builds the model, and inference, which runs it.",
    ),
    refs: ["5.2:axes"],
    links: [S.tobyOrd, S.testTimeCompute],
  },
  children: [
    sub(
      "training",
      t("学習（モデルをつくる）", "Training (builds the model)"),
      {
        summary: t(
          "重みを更新して、モデルの能力そのものを上げる。費用は前払いになる。",
          "Updating the weights to raise the model's own capability; the cost is paid up front.",
        ),
        refs: ["5.2:upfront", "3.1"],
        links: [S.kaplan, S.chinchilla, S.epochModels],
      },
      [
        item("pretraining", t("事前学習", "Pretraining"), {
          summary: t(
            "大量の文章で次のトークンを予測させ、知識と言語の土台をつくる。",
            "Predicting the next token over vast amounts of text to build the base of knowledge and language.",
          ),
          note: t(
            "損失の下がり方はべき乗則で予測しやすいが、それがどの能力として現れるかは読みにくい。制約は電力と、人間が書いた公開テキストの枯渇。費用は前払いで、モデルがフロンティアにいる短い期間のうちに回収するしかない。",
            "How loss falls is predictable from power laws, but which capabilities emerge is hard to read; the limits are power and running out of public human-written text. The cost is paid up front and has to be recovered in the short time a model stays at the frontier.",
          ),
          refs: ["5.2:loss", "5.2:slowing", "5.2:data", "5.3:recover"],
          links: [S.kaplan, S.chinchilla, S.epochScaling, S.villalobos],
        }),
        item("sft", t("教師あり微調整・蒸留", "Fine-tuning and distillation"), {
          summary: t(
            "手本の回答で調整する。強いモデルの出力で別のモデルを学習させる蒸留も含む。",
            "Tuning on example answers, including distillation — training one model on a stronger model's outputs.",
          ),
          note: t(
            "Anthropic の 2026 年 1〜9 月の売上の約 5〜7% は規約違反の顧客からのもので、報道によれば、そこには他社が Claude の出力で学習する蒸留目的の利用も含まれる。",
            "About 5–7% of Anthropic's January–September 2026 revenue came from customers violating its terms, reportedly including distillation by other labs.",
          ),
          refs: ["3.2:distill"],
          links: [S.distillation, S.instructGpt, S.s1, S.decoderAnthropic],
        }),
        item("rlhf", t("人の好み（RLHF）", "Human preferences (RLHF)"), {
          summary: t(
            "人が回答を比べて付けた順位から報酬モデルを学習し、それを報酬にして強化学習する。正誤を判定しにくい仕事にも使えるが、人の評価はぶれやすい。",
            "RL against a reward model trained on people's rankings of answers; usable where correctness is hard to judge, but human judgments are noisy.",
          ),
          note: t(
            "OpenAI の InstructGPT の研究（2022 年）では、13 億パラメータの InstructGPT の出力が、100 倍以上大きい 1,750 億パラメータの GPT-3 の出力より、人の評価で好まれた。",
            "In OpenAI's InstructGPT work (2022), people preferred the outputs of the 1.3B-parameter InstructGPT to those of the 175B-parameter GPT-3, a model over 100 times larger.",
          ),
          refs: ["5.3:hardToJudge"],
          links: [S.instructGpt, S.humanPreferences],
        }),
        item("rlvr", t("自動採点（RLVR）", "Verifiable rewards (RLVR)"), {
          summary: t(
            "数学やプログラムのように、正誤を機械で判定できる課題で強化学習する。",
            "RL on tasks whose answers a machine can check, such as math and code.",
          ),
          note: t(
            "DeepSeek-R1 はこの方法で o1 の成果を安く再現し、xAI は Grok 4 で強化学習を事前学習と同じ規模で行ったと発表した。課題の範囲を決めれば、伸び方は、上限に近づくと飽和する S 字で予測できる。",
            "DeepSeek-R1 used it to reproduce o1's results cheaply, and xAI says it ran RL for Grok 4 at pretraining scale; within a task range it follows a predictable S-curve that saturates near a ceiling.",
          ),
          refs: ["5.2:rl", "4.6:rlvr"],
          links: [S.tulu3, S.deepseekR1, S.rlScaling, S.grok4],
        }),
        item("agentic-rl", t("エージェント向け強化学習", "Agentic RL"), {
          summary: t(
            "道具を使い、何手もかけて進める作業を、環境の中で試行錯誤させて学ばせる。ハーネスの中での働き方を身につける学習でもある。",
            "Learning multi-step, tool-using work by trial and error inside environments — which also teaches the model how to work inside a harness.",
          ),
          note: t(
            "伸ばし続けられるかどうかは、採点できる課題と環境の数で決まる。xAI は Grok 4 を、道具を使うように強化学習で学ばせ、検証できる学習データを数学とコード中心から多くの分野へ広げたとしている。",
            "How far it can keep growing depends on how many gradable tasks and environments exist. xAI says it trained Grok 4 with RL to use tools and widened its verifiable training data from mostly math and code to many more domains.",
          ),
          refs: ["5.2:rl"],
          links: [S.sweRl, S.sweGym, S.kimiK2, S.grok4],
        }),
      ],
    ),
    sub(
      "inference",
      t("推論（モデルを動かす）", "Inference (runs the model)"),
      {
        summary: t(
          "1 件の仕事に使う計算を増やし、その場で出来を上げる。動かす計算資源は前もって契約した固定費だが、使った分はその場でトークン単位の売上になるので、学習費のように回収が先送りにならない。",
          "Spending more compute on each job to raise quality on the spot. The capacity it runs on is a pre-committed fixed cost, but what is used turns into per-token revenue at once, so recovery is not deferred as it is for training.",
        ),
        refs: ["5.2:perUse", "5.2:perToken", "5.3:inferenceRecovery", "5.3:answer"],
        links: [S.o1, S.testTimeCompute, S.priceOfProgress],
      },
      [
        item("depth", t("深さ：長く考える", "Depth: think longer"), {
          summary: t("回答の前に長く考えさせる。", "Letting the model think longer before answering."),
          note: t(
            "課題ごとに、考える量の対数に比例して正答率が伸びる。考える過程が言葉として外に出ていることは、モデルの意図を監視する手段にもなっている。トークンを出さずに内部で考える再帰的な深さに移ると、それが損なわれるおそれがある。",
            "Accuracy rises with the logarithm of thinking compute, task by task. Reasoning written out in words also lets people monitor a model's intent; recurrent depth, which thinks internally without emitting tokens, could undermine that.",
          ),
          refs: ["4.6:tts", "4.6:o1", "5.2:ord", "4.6:monitor"],
          links: [S.o1, S.recurrentDepth, S.cotMonitorability],
        }),
        item("width", t("幅：並列に考えて選ぶ", "Width: sample and select"), {
          summary: t("答えを並列に複数出し、多数決や採点で選ぶ。", "Producing several answers in parallel and picking one by vote or grader."),
          note: t(
            "xAI は、並列に考えさせる計算で複数の仮説を同時に検討させる Grok 4 Heavy を、上位のプランで売っている。考える幅も、考える深さと同じく製品の価格差になる。",
            "xAI sells Grok 4 Heavy, which uses parallel test-time compute to weigh several hypotheses at once, in a premium tier: breadth of thinking, like depth, becomes a price tier.",
          ),
          refs: ["4.6:o1", "4.6:tts"],
          links: [S.o1, S.selfConsistency, S.verifiers, S.testTimeCompute, S.grok4],
        }),
        item("ttt", t("テスト時学習", "Test-time training"), {
          summary: t(
            "解く課題の例題を使って、推論の途中で重みを一時的に更新する。更新は課題ごとに捨てるので、使うのは推論の計算である。",
            "Temporarily updating the weights on the task's own examples during inference; the update is discarded after each task, so what it spends is inference compute.",
          ),
          note: t(
            "Akyürek らは、ARC の課題ごとに例題で重みを更新すると、微調整しただけのモデルの最大 6 倍の正答率になり、80 億パラメータのモデルで公開検証セットの 53.0% を解いたと報告した。",
            "Akyürek et al. report that updating the weights on each ARC task's examples gives up to 6x the accuracy of fine-tuned baselines, solving 53.0% of the public validation set with an 8B-parameter model.",
          ),
          links: [S.testTimeTraining, S.tttLayers],
        }),
      ],
    ),
    sub(
      "after-deploy",
      t("配備後の学習", "Learning after deployment"),
      {
        summary: t(
          "配備したモデルを、実際の利用で得た結果から学ばせ続ける。更新した重みは、その後の利用すべてに使われる。",
          "Continuing to train the deployed model on results from real use; the updated weights serve all later use.",
        ),
        links: [S.cursorRl],
      },
      [
        item("online-rl", t("オンライン強化学習", "Online RL"), {
          summary: t(
            "実際の利用で得た結果を報酬にして、配備中のモデルを学習させ続ける。",
            "Continually training the deployed model with rewards from real use.",
          ),
          note: t(
            "Cursor は、コード補完のモデルを 1 日に何度も入れ替えている。報酬は、受け入れられる提案を増やし、受け入れられない提案を減らすように決めている。新しいモデルの提案は 21% 減り、受け入れ率は 28% 上がった。",
            "Cursor rolls out new code-completion models to users several times a day, with a reward that favours accepted suggestions and penalizes showing ones that are not accepted; the new model makes 21% fewer suggestions with a 28% higher accept rate.",
          ),
          links: [S.cursorRl],
        }),
      ],
    ),
  ],
};
