export type Project = {
  title: string;
  description: { ja: string; en: string };
  tech: string[];
  github?: string;
  demo?: string;
  link?: string;
  linkLabel?: { ja: string; en: string };
};

export const projects: Project[] = [
  {
    title: "NimNet",
    description: {
      ja: "Python の NetworkX にインスパイアされた、Nim 言語向けの包括的なネットワーク科学ライブラリ。48 種のアルゴリズムモジュール、10 種の I/O フォーマット、並列処理対応。CSR 表現によるキャッシュフレンドリーな設計で、NetworkX を最大 30 倍上回る性能を達成。",
      en: "A comprehensive network science library for Nim, inspired by Python's NetworkX. Features 48 algorithm modules, 10 I/O formats, and parallel processing. Cache-friendly CSR representation achieves up to 30x performance over NetworkX.",
    },
    tech: ["Nim", "Graph Algorithms", "Network Science", "CSR"],
    github: "https://github.com/yoichiozaki/nimnet",
    demo: "https://yoichiozaki.github.io/nimnet",
  },
  {
    title: "Microsoft認定資格試験テキスト AI-900",
    description: {
      ja: "『Microsoft認定資格試験テキスト AI-900：Microsoft Azure AI Fundamentals』（SBクリエイティブ、2026年2月刊行）の共著者。日本マイクロソフトの現役エンジニア陣による AI と Azure AI サービスの入門解説書。",
      en: "Co-author of 'Microsoft Certified Exam Textbook AI-900: Microsoft Azure AI Fundamentals' (SB Creative, Feb 2026). An introductory guide to AI and Azure AI services written by active Microsoft Japan engineers.",
    },
    tech: ["Azure", "AI", "Machine Learning", "Cloud"],
    link: "https://www.amazon.co.jp/dp/4815638136",
    linkLabel: { ja: "Amazon で見る", en: "View on Amazon" },
  },
  {
    title: "Personal Blog",
    description: {
      ja: "Next.js + MDX + Tailwind CSS で構築した個人ブログ・ポートフォリオサイト。日英バイリンガル対応、ダークモード、GitHub Pages でホスティング。",
      en: "A personal blog and portfolio site built with Next.js + MDX + Tailwind CSS. Supports Japanese/English bilingual content, dark mode, hosted on GitHub Pages.",
    },
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "MDX"],
    github: "https://github.com/yoichiozaki/yoichiozaki.github.io",
    demo: "https://yoichiozaki.github.io",
  },
];
