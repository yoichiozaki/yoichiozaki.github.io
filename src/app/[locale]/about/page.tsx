import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

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
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {dict.about.title}
        </h1>
        <p className="text-muted-foreground">{dict.about.description}</p>
      </header>

      <section className="space-y-4">
        <p className="leading-relaxed">
          {locale === "ja"
            ? "日本マイクロソフトでテクノロジーコンサルタントとして、お客様のクラウド導入や AI 活用を支援しています。共著で『Microsoft認定資格試験テキスト AI-900』を執筆。新しい技術に触れることが好きで、学んだことをアウトプットすることを大切にしています。"
            : "Technology Consultant at Microsoft Japan, helping customers with cloud adoption and AI solutions. Co-authored 'Microsoft Certified Exam Textbook AI-900'. I enjoy exploring new technologies and believe in the importance of sharing what I learn."}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{dict.about.skills}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(skills).map(([category, items]) => (
            <div
              key={category}
              className="border border-border rounded-lg p-4 space-y-2"
            >
              <h3 className="font-medium text-sm text-muted-foreground">
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm bg-muted px-2 py-1 rounded"
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
        <h2 className="text-xl font-semibold">{dict.about.contact}</h2>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <a
            href="https://github.com/yoichiozaki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/ozakiyoichi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            LinkedIn
          </a>
          <a
            href="https://bsky.app/profile/yoichiozaki.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Bluesky
          </a>
          <a
            href="https://x.com/yoichiozakix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            X
          </a>
        </div>
      </section>
    </div>
  );
}
