import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { type Locale, locales } from "@/i18n/config";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { notFound } from "next/navigation";
import { CodePlaygroundLazy as CodePlayground } from "@/components/CodePlaygroundLazy";

const mdxComponents = {
  CodePlayground,
};

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <time className="text-sm text-muted-foreground">{post.date}</time>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground">{post.description}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>
    </article>
  );
}
