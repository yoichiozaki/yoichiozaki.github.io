import Link from "next/link";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllPosts } from "@/lib/blog";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const posts = getAllPosts(locale as Locale).slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {dict.home.greeting}
        </h1>
        <p className="text-lg text-muted-foreground">{dict.home.subtitle}</p>
        <p className="text-muted-foreground leading-relaxed">
          {dict.home.description}
        </p>
      </section>

      {/* Latest posts */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">{dict.home.latestPosts}</h2>
        {posts.length > 0 ? (
          <>
            <div className="space-y-6">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group border border-border rounded-lg p-5 hover:border-accent/50 transition-colors"
                >
                  <Link href={`/${locale}/blog/${post.slug}`}>
                    <time className="text-sm text-muted-foreground">
                      {post.date}
                    </time>
                    <h3 className="text-lg font-medium mt-1 group-hover:text-accent transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {post.description}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
            <Link
              href={`/${locale}/blog`}
              className="inline-block text-sm text-accent hover:underline"
            >
              {dict.home.viewAll} →
            </Link>
          </>
        ) : (
          <p className="text-muted-foreground">{dict.blog.noPosts}</p>
        )}
      </section>
    </div>
  );
}
