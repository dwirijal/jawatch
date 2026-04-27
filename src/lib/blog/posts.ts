import frierenPost from '../../../content/blog/anime-mirip-frieren.json' with { type: 'json' };
import tensuraPost from '../../../content/blog/panduan-tensura.json' with { type: 'json' };
import drStonePost from '../../../content/blog/urutan-nonton-dr-stone.json' with { type: 'json' };
import jujutsuPost from '../../../content/blog/urutan-nonton-jujutsu-kaisen.json' with { type: 'json' };
import mobPsychoPost from '../../../content/blog/urutan-nonton-mob-psycho-100.json' with { type: 'json' };
import { getGeneratedBlogPosts } from './generated-posts.ts';
import type { BlogPost } from './types.ts';

type RawBlogPost = Omit<BlogPost, 'source'>;

const MANUAL_POSTS: RawBlogPost[] = [
  jujutsuPost as RawBlogPost,
  drStonePost as RawBlogPost,
  frierenPost as RawBlogPost,
  tensuraPost as RawBlogPost,
  mobPsychoPost as RawBlogPost,
];

function toManualPost(post: RawBlogPost): BlogPost {
  return {
    ...post,
    source: 'manual',
  };
}

function sortByUpdatedAtDesc(left: BlogPost, right: BlogPost): number {
  return right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title);
}

function assertUniqueSlugs(posts: BlogPost[]): void {
  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`Duplicate blog slug: ${post.slug}`);
    }
    seen.add(post.slug);
  }
}

export function getAllBlogPosts(): BlogPost[] {
  const posts = [...MANUAL_POSTS.map(toManualPost), ...getGeneratedBlogPosts()].sort(sortByUpdatedAtDesc);
  assertUniqueSlugs(posts);
  return posts;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getFeaturedBlogPosts(limit = 3): BlogPost[] {
  return getAllBlogPosts().slice(0, Math.max(1, limit));
}

export function getBlogCategoryLabel(category: BlogPost['category']): string {
  switch (category) {
    case 'recommendation':
      return 'Rekomendasi';
    case 'release-guide':
      return 'Rilis';
    case 'watch-guide':
    default:
      return 'Panduan nonton';
  }
}

export function getRelatedHref(related: BlogPost['related'][number]): string {
  return `/${related.type}/${related.slug}`;
}
