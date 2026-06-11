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
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="gradient-text">{dict.portfolio.title}</span>
        </h1>
        <p className="text-muted-foreground">{dict.portfolio.description}</p>
      </header>

      <div className="space-y-5">
        {projects.map((project) => (
          <div
            key={project.title}
            className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 p-6 space-y-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <h2 className="text-xl font-semibold transition-colors group-hover:text-accent">
              {project.title}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {project.description[locale as Locale]}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-4 pt-1">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {dict.portfolio.viewSource} →
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {dict.portfolio.viewDemo} →
                </a>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:underline"
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
