import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCommentTree,
  buildUnitLikeId,
  summarizeCommunityTitleActivity,
  summarizeCommunityVaultActivity,
} from '../../src/lib/community.ts';

test('buildCommentTree keeps only two levels and attaches replies to the root comment', () => {
  const comments = [
    {
      id: 'root-1',
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:1',
      unitLabel: 'Episode 1',
      unitHref: '/series/blue-lock/episodes/ep-1',
      mediaType: 'anime',
      authorName: 'Kai',
      content: 'Root comment',
      parentId: null,
      timestamp: 100,
    },
    {
      id: 'reply-1',
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:1',
      unitLabel: 'Episode 1',
      unitHref: '/series/blue-lock/episodes/ep-1',
      mediaType: 'anime',
      authorName: 'Rin',
      content: 'Reply comment',
      parentId: 'root-1',
      timestamp: 110,
    },
    {
      id: 'nested-reply',
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:1',
      unitLabel: 'Episode 1',
      unitHref: '/series/blue-lock/episodes/ep-1',
      mediaType: 'anime',
      authorName: 'Nagi',
      content: 'Nested reply should attach to the same root',
      parentId: 'reply-1',
      timestamp: 120,
    },
  ];

  const tree = buildCommentTree(comments);

  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, 'root-1');
  assert.deepEqual(
    tree[0].replies.map((reply) => reply.id),
    ['reply-1', 'nested-reply'],
  );
});

test('community summaries aggregate likes and comments across units and titles', () => {
  const likes = [
    {
      id: buildUnitLikeId('series:blue-lock', 'episode:1'),
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:1',
      unitLabel: 'Episode 1',
      unitHref: '/series/blue-lock/episodes/ep-1',
      mediaType: 'anime',
      timestamp: 100,
    },
    {
      id: buildUnitLikeId('series:blue-lock', 'episode:2'),
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:2',
      unitLabel: 'Episode 2',
      unitHref: '/series/blue-lock/episodes/ep-2',
      mediaType: 'anime',
      timestamp: 110,
    },
  ];
  const comments = [
    {
      id: 'comment-1',
      titleId: 'series:blue-lock',
      titleLabel: 'Blue Lock',
      unitId: 'episode:1',
      unitLabel: 'Episode 1',
      unitHref: '/series/blue-lock/episodes/ep-1',
      mediaType: 'anime',
      authorName: 'Kai',
      content: 'Comment on episode 1',
      parentId: null,
      timestamp: 120,
    },
    {
      id: 'comment-2',
      titleId: 'movie:godzilla-minus-one',
      titleLabel: 'Godzilla Minus One',
      unitId: 'movie:godzilla-minus-one',
      unitLabel: 'Movie',
      unitHref: '/movies/godzilla-minus-one',
      mediaType: 'movie',
      authorName: 'Mina',
      content: 'Comment on the movie page',
      parentId: null,
      timestamp: 130,
    },
  ];

  const titleSummary = summarizeCommunityTitleActivity(likes, comments, ['episode:1', 'episode:2', 'episode:3']);
  const vaultSummary = summarizeCommunityVaultActivity(likes, comments);

  assert.deepEqual(titleSummary, {
    likeCount: 2,
    commentCount: 1,
    activeUnitCount: 2,
    latestActivityAt: 120,
  });
  assert.deepEqual(vaultSummary, {
    likeCount: 2,
    commentCount: 2,
    activeTitleCount: 2,
    latestActivityAt: 130,
  });
});
