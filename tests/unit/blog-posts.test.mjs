import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedHref,
} from '../../src/lib/blog/posts.ts';

test('blog posts expose unique slugs and include manual plus generated content', () => {
  const posts = getAllBlogPosts();
  const slugs = posts.map((post) => post.slug);

  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(posts.some((post) => post.source === 'manual'));
  assert.ok(posts.some((post) => post.source === 'generated'));
});

test('blog post lookup resolves SEO guide slugs', () => {
  const post = getBlogPostBySlug('urutan-nonton-jujutsu-kaisen');

  assert.equal(post?.title, 'Urutan Nonton Jujutsu Kaisen');
  assert.ok(post?.related.some((item) => item.slug === 'jujutsu-kaisen'));
});

test('blog related links map to public catalog routes', () => {
  assert.equal(getRelatedHref({ type: 'series', slug: 'dr-stone', label: 'Dr. Stone' }), '/series/dr-stone');
  assert.equal(getRelatedHref({ type: 'movies', slug: 'jujutsu-kaisen-0', label: 'Jujutsu Kaisen 0' }), '/movies/jujutsu-kaisen-0');
  assert.equal(getRelatedHref({ type: 'comics', slug: 'one-piece', label: 'One Piece' }), '/comics/one-piece');
});
