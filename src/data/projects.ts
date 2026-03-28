export type Project = {
  title: string;
  description: { ja: string; en: string };
  tech: string[];
  github?: string;
  demo?: string;
};

export const projects: Project[] = [
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
