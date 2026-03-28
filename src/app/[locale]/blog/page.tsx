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
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{dict.blog.title}</h1>
        <p className="text-muted-foreground">{dict.blog.description}</p>
      </header>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group border border-border rounded-lg p-5 hover:border-accent/50 transition-colors"
            >
              <Link href={`/${locale}/blog/${post.slug}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <time className="text-sm text-muted-foreground">
                    {post.date}
                  </time>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-medium group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
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
