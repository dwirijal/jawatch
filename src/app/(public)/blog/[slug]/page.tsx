import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import {
  getAllBlogPosts,
  getBlogCategoryLabel,
  getBlogPostBySlug,
  getRelatedHref,
} from '@/lib/blog/posts';
import { buildArticleJsonLd, buildMetadata } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: 'Artikel Tidak Ditemukan',
      description: 'Artikel blog yang kamu cari tidak tersedia di Jawatch.',
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: post.image,
    keywords: post.tags,
  });
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="app-shell" data-theme="drama">
      <JsonLd
        data={buildArticleJsonLd({
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          image: post.image,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          tags: post.tags,
        })}
      />

      <article>
        <section className="border-b border-border-subtle bg-surface-0">
          <div className="app-container-wide grid gap-8 py-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="max-w-3xl">
              <Link href="/blog" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Blog
              </Link>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-black uppercase text-muted-foreground">
                <span>{getBlogCategoryLabel(post.category)}</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {post.updatedAt}
                </span>
              </div>
              <h1 className="text-3xl font-black leading-tight text-foreground sm:text-5xl">{post.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{post.description}</p>
            </div>
            <div
              className="aspect-[16/10] rounded-[var(--radius-sm)] border border-border-subtle bg-cover bg-center shadow-[0_28px_80px_-54px_var(--shadow-color-strong)]"
              style={{ backgroundImage: `url(${post.image || '/icon.png'})` }}
              aria-hidden="true"
            />
          </div>
        </section>

        <div className="app-container-wide grid gap-8 py-8 lg:grid-cols-[minmax(0,720px)_320px]">
          <div className="space-y-8">
            {post.sections.map((section) => (
              <section key={section.heading} className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated p-5 sm:p-6">
                <h2 className="text-xl font-black text-foreground">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">{section.body}</p>
              </section>
            ))}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-5">
              <h2 className="text-sm font-black uppercase text-muted-foreground">Buka katalog</h2>
              <div className="mt-4 grid gap-2">
                {post.related.map((item) => (
                  <Link
                    key={`${item.type}:${item.slug}`}
                    href={getRelatedHref(item)}
                    className="rounded-[var(--radius-xs)] border border-border-subtle bg-surface-elevated px-3 py-2 text-sm font-bold text-foreground transition hover:border-border-strong"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-5">
              <h2 className="text-sm font-black uppercase text-muted-foreground">Topik</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-xs font-bold text-muted-foreground">
                    <Tag className="size-3" aria-hidden="true" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
