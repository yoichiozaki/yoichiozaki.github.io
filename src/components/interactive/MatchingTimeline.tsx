"use client";

type Props = { locale?: string };

type Event = {
  year: string;
  kind: "theory" | "practice";
  ja: string;
  en: string;
};

const EVENTS: Event[] = [
  {
    year: "1952",
    kind: "practice",
    ja: "米国で研修医の全国マッチング（現 NRMP）が始まる。Boston Pool 方式（学校選択の «Boston 方式» とは別物）を下敷きにした手続きで、のちに «病院側が申し込む受入保留» と同じ結果を返すことがわかる",
    en: "The US national residency match (today's NRMP) starts, built on the Boston Pool plan (unrelated to the «Boston mechanism» of school choice) — later shown to produce the same outcome as hospital-proposing deferred acceptance",
  },
  {
    year: "1962",
    kind: "theory",
    ja: "Gale と Shapley「College Admissions and the Stability of Marriage」。安定マッチングの存在と、提案側に最適な受入保留アルゴリズムを示す",
    en: "Gale and Shapley, “College Admissions and the Stability of Marriage”: stable matchings always exist, and deferred acceptance finds the proposer-optimal one",
  },
  {
    year: "1971",
    kind: "theory",
    ja: "McVitie と Wilson、すべての安定マッチングを列挙するアルゴリズム",
    en: "McVitie and Wilson give an algorithm that lists every stable matching",
  },
  {
    year: "1976",
    kind: "theory",
    ja: "Knuth『Mariages stables』。安定マッチング全体が束をなすこと（Conway に帰す）、ブロッキングペアの解消が循環しうることなどを整理",
    en: "Knuth's “Mariages stables”: the stable matchings form a lattice (credited to Conway), repairing blocking pairs can cycle, and more",
  },
  {
    year: "1981–82",
    kind: "theory",
    ja: "Dubins–Freedman、Roth: 提案側にとって正直な申告が支配戦略。一方、全員にとって耐戦略的な安定メカニズムは存在しない（Roth）",
    en: "Dubins–Freedman and Roth: truth-telling is dominant for proposers, yet no stable mechanism is strategy-proof for everyone (Roth)",
  },
  {
    year: "1984",
    kind: "theory",
    ja: "Roth、1952 年以来の NRMP の手続きが安定マッチングを返すことを指摘し、採用時期の «早期化»（unraveling）が止まった理由を説明",
    en: "Roth shows the NRMP procedure in use since 1952 yields stable matchings — explaining why the market stopped unraveling",
  },
  {
    year: "1985–87",
    kind: "theory",
    ja: "Irving のルームメイト問題アルゴリズム、Irving–Leather–Gusfield の平等主義安定マッチング",
    en: "Irving's stable roommates algorithm; Irving–Leather–Gusfield's egalitarian stable matching",
  },
  {
    year: "1998",
    kind: "practice",
    ja: "NRMP が研修医側が申し込む Roth–Peranson アルゴリズムに移行。カップルなど現実の複雑な条件も扱えるよう設計されている",
    en: "The NRMP switches to the applicant-proposing Roth–Peranson algorithm, designed to handle real-world complications such as couples",
  },
  {
    year: "2003–05",
    kind: "practice",
    ja: "ニューヨーク市の高校入学が受入保留方式を導入し、ボストン市も 2005 年に移行を決定（実施は 2006 年）。日本でも 2004 年度開始の新医師臨床研修制度とともにマッチング（JRMP）が始まる",
    en: "New York City high schools adopt deferred acceptance and Boston decides to follow in 2005 (in use from 2006); Japan's residency match (JRMP) starts with the new postgraduate training system of 2004",
  },
  {
    year: "2012",
    kind: "theory",
    ja: "Shapley と Roth にノーベル経済学賞（安定配分の理論とマーケットデザインの実践）。Gale は 2008 年に死去していた",
    en: "Shapley and Roth receive the Nobel Memorial Prize in Economic Sciences for stable allocations and market design; Gale had died in 2008",
  },
  {
    year: "2015",
    kind: "theory",
    ja: "鎌田雄一郎と小島武仁、地域ごとの採用上限（JRMP など）のもとで既存の方式が非効率・不安定になりうることを示し、«柔軟な受入保留» を提案",
    en: "Kamada and Kojima show that existing mechanisms can be inefficient and unstable under regional caps (as in the JRMP) and propose flexible deferred acceptance",
  },
  {
    year: "2018",
    kind: "practice",
    ja: "フランスの大学入学プラットフォーム Parcoursup が、受入保留を «人間が回す» 形で運用",
    en: "France's Parcoursup runs a human-in-the-loop form of deferred acceptance for university admissions",
  },
];

export function MatchingTimeline({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <div className="not-prose my-6 rounded-xl border border-border bg-muted/40 p-4">
      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#cc785c]" />
          {isJa ? "理論" : "theory"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5db8a6]" />
          {isJa ? "実装・制度" : "practice"}
        </span>
      </div>
      <ol className="relative space-y-3 border-l border-border pl-5">
        {EVENTS.map((e) => (
          <li key={e.year + e.en.slice(0, 12)} className="relative">
            <span
              className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background"
              style={{ backgroundColor: e.kind === "theory" ? "#cc785c" : "#5db8a6" }}
            />
            <div className="font-mono text-xs font-semibold text-foreground">{e.year}</div>
            <div className="text-xs leading-relaxed text-muted-foreground">{isJa ? e.ja : e.en}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
