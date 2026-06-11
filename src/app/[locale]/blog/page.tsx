import Link from "next/link";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts } from "@/lib/blog";

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
    title: dict.blog.title,
    description: dict.blog.description,
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const posts = getAllPosts(locale as Locale);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="gradient-text">{dict.blog.title}</span>
        </h1>
        <p className="text-muted-foreground">{dict.blog.description}</p>
      </header>

      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Link href={`/${locale}/blog/${post.slug}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <time className="font-mono text-xs text-muted-foreground">
                    {post.date}
                  </time>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-background/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors group-hover:border-accent/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-medium transition-colors group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{dict.blog.noPosts}</p>
      )}
    </div>
  );
}
