import Link from "next/link";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts } from "@/lib/blog";
import { SocialLinks } from "@/components/SocialLinks";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const posts = getAllPosts(locale as Locale).slice(0, 3);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative">
        <div className="space-y-6">
          <p className="animate-fade-in-up font-mono text-sm text-accent">
            <span className="text-muted-foreground">~/</span>whoami
          </p>
          <h1
            className="animate-fade-in-up text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ animationDelay: "60ms" }}
          >
            <span className="gradient-text">{dict.home.greeting}</span>
          </h1>
          <p
            className="animate-fade-in-up text-lg font-medium text-foreground/80"
            style={{ animationDelay: "120ms" }}
          >
            {dict.home.subtitle}
          </p>
          <p
            className="animate-fade-in-up max-w-xl leading-relaxed text-muted-foreground"
            style={{ animationDelay: "180ms" }}
          >
            {dict.home.description}
          </p>
          <div
            className="animate-fade-in-up flex flex-wrap items-center gap-3 pt-2"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]"
            >
              {dict.nav.blog}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={`/${locale}/about`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent/50 hover:text-accent"
            >
              {dict.nav.about}
            </Link>
            <SocialLinks className="ml-1 flex gap-4" />
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section className="space-y-7">
        <h2 className="flex items-center gap-3 text-xl font-semibold">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-accent to-accent-2" />
          {dict.home.latestPosts}
        </h2>
        {posts.length > 0 ? (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group relative overflow-hidden rounded-xl border border-border bg-muted/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
                >
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <Link href={`/${locale}/blog/${post.slug}`}>
                    <time className="font-mono text-xs text-muted-foreground">
                      {post.date}
                    </time>
                    <h3 className="mt-1.5 text-lg font-medium transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
            <Link
              href={`/${locale}/blog`}
              className="group inline-flex items-center gap-1 text-sm font-medium text-accent"
            >
              {dict.home.viewAll}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </>
        ) : (
          <p className="text-muted-foreground">{dict.blog.noPosts}</p>
        )}
      </section>
    </div>
  );
}
