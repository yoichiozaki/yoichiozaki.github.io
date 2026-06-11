import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SocialLinks } from "@/components/SocialLinks";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.about.title,
    description: dict.about.description,
  };
}

const skills = {
  Languages: ["TypeScript", "JavaScript", "Python", "Go", "Nim", "C", "Rust"],
  Frontend: ["React", "Next.js", "Tailwind CSS"],
  Cloud: ["Microsoft Azure", "GitHub Actions", "Docker"],
  Tools: ["Git", "Node.js", "Linux"],
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="gradient-text">{dict.about.title}</span>
        </h1>
        <p className="text-muted-foreground">{dict.about.description}</p>
      </header>

      <section className="space-y-4">
        <p className="leading-relaxed text-foreground/90">
          {locale === "ja"
            ? "日本マイクロソフトでテクノロジーコンサルタントとして、お客様のクラウド導入や AI 活用を支援しています。共著で『Microsoft認定資格試験テキスト AI-900』を執筆。新しい技術に触れることが好きで、学んだことをアウトプットすることを大切にしています。"
            : "Technology Consultant at Microsoft Japan, helping customers with cloud adoption and AI solutions. Co-authored 'Microsoft Certified Exam Textbook AI-900'. I enjoy exploring new technologies and believe in the importance of sharing what I learn."}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-accent-2" />
          {dict.about.skills}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(skills).map(([category, items]) => (
            <div
              key={category}
              className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 transition-colors hover:border-accent/40"
            >
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-accent-2" />
          {dict.about.contact}
        </h2>
        <SocialLinks className="flex flex-wrap gap-4" />
      </section>
    </div>
  );
}
