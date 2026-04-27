import type { Metadata } from 'next';
import { BookOpen, ChevronRight, Newspaper } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { getAllBlogPosts, getBlogCategoryLabel, getFeaturedBlogPosts } from '@/lib/blog/posts';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Blog Anime, Film, dan Komik',
  description: 'Panduan nonton, rekomendasi anime, urutan franchise, dan artikel katalog Jawatch untuk membantu memilih tontonan dan bacaan berikutnya.',
  path: '/blog',
  keywords: ['blog anime', 'urutan nonton anime', 'rekomendasi anime', 'panduan nonton subtitle indonesia'],
});

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const featuredPosts = getFeaturedBlogPosts(3);

  return (
    <main className="app-shell" data-theme="drama">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Blog Anime, Film, dan Komik',
          description: 'Panduan nonton, rekomendasi, dan artikel katalog Jawatch.',
          path: '/blog',
          items: posts.map((post) => ({
            name: post.title,
            url: `/blog/${post.slug}`,
            image: post.image,
          })),
        })}
      />

      <section className="border-b border-border-subtle bg-surface-0">
        <div className="app-container-wide py-10 sm:py-12">
          <div className="flex max-w-3xl flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
              <Newspaper className="size-4" aria-hidden="true" />
              Blog Jawatch
            </div>
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">Panduan nonton dan rekomendasi katalog</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Artikel pendek untuk membantu memilih urutan nonton, memahami franchise besar, dan menemukan judul yang sudah tersedia di Jawatch.
            </p>
          </div>
        </div>
      </section>

      <div className="app-container-wide py-8 sm:py-10">
        <section className="grid gap-4 lg:grid-cols-3" aria-label="Artikel unggulan">
          {featuredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated shadow-[0_18px_46px_-38px_var(--shadow-color)] transition hover:-translate-y-0.5 hover:border-border-strong"
            >
              <div
                className="aspect-[16/9] bg-cover bg-center"
                style={{ backgroundImage: `url(${post.image || '/icon.png'})` }}
                aria-hidden="true"
              />
              <div className="flex min-h-60 flex-col gap-3 p-5">
                <span className="text-xs font-black uppercase text-muted-foreground">{getBlogCategoryLabel(post.category)}</span>
                <h2 className="text-xl font-black leading-tight text-foreground">{post.title}</h2>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-black text-[var(--accent-strong)]">
                  Baca panduan
                  <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-10" aria-label="Semua artikel">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="size-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xl font-black text-foreground">Semua artikel</h2>
          </div>
          <div className="grid gap-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group grid gap-4 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-4 transition hover:border-border-strong sm:grid-cols-[120px_1fr_auto] sm:items-center"
              >
                <div
                  className="aspect-[16/9] rounded-[var(--radius-xs)] bg-cover bg-center sm:aspect-[4/3]"
                  style={{ backgroundImage: `url(${post.image || '/icon.png'})` }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-muted-foreground">{getBlogCategoryLabel(post.category)}</p>
                  <h3 className="mt-1 text-base font-black text-foreground">{post.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.description}</p>
                </div>
                <ChevronRight className="hidden size-5 text-muted-foreground transition group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
