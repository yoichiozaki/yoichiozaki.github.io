import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { projects } from "@/data/projects";

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
    title: dict.portfolio.title,
    description: dict.portfolio.description,
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {dict.portfolio.title}
        </h1>
        <p className="text-muted-foreground">{dict.portfolio.description}</p>
      </header>

      <div className="space-y-6">
        {projects.map((project) => (
          <div
            key={project.title}
            className="border border-border rounded-lg p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="text-muted-foreground">
              {project.description[locale as Locale]}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-4">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {dict.portfolio.viewSource} →
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {dict.portfolio.viewDemo} →
                </a>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {project.linkLabel?.[locale as Locale] ?? project.link} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
