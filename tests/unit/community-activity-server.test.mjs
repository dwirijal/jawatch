import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getViewerCommunitySummary,
  syncLocalCommunityActivity,
  toggleUnitLikeForUser,
} from '../../src/lib/server/community-activity.ts';

function createLikeToggleSupabaseMock({ existingLike = null } = {}) {
  const calls = [];

  const supabase = {
    from(table) {
      if (table !== 'community_unit_likes') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select(selection) {
          calls.push({ table, action: 'select', selection });
          return {
            eq(column, value) {
              calls.push({ table, action: 'eq', column, value });
              return {
                eq(innerColumn, innerValue) {
                  calls.push({ table, action: 'eq', column: innerColumn, value: innerValue });
                  return {
                    eq(finalColumn, finalValue) {
                      calls.push({ table, action: 'eq', column: finalColumn, value: finalValue });
                      return {
                        async maybeSingle() {
                          calls.push({ table, action: 'maybeSingle' });
                          return { data: existingLike, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
        upsert(payload, options) {
          calls.push({ table, action: 'upsert', payload, options });
          return Promise.resolve({ error: null });
        },
        delete() {
          calls.push({ table, action: 'delete' });
          return {
            eq(column, value) {
              calls.push({ table, action: 'eq', column, value });
              return {
                eq(innerColumn, innerValue) {
                  calls.push({ table, action: 'eq', column: innerColumn, value: innerValue });
                  return {
                    eq(finalColumn, finalValue) {
                      calls.push({ table, action: 'eq', column: finalColumn, value: finalValue });
                      return Promise.resolve({ error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  return { supabase, calls };
}

function createCommunitySyncSupabaseMock({ likeRows = [], commentRows = [] } = {}) {
  const calls = [];

  const supabase = {
    from(table) {
      if (table === 'community_unit_likes') {
        return {
          upsert(payload, options) {
            calls.push({ table, action: 'upsert', payload, options });
            return Promise.resolve({ error: null });
          },
          select(selection) {
            calls.push({ table, action: 'select', selection });
            return {
              eq(column, value) {
                calls.push({ table, action: 'eq', column, value });
                return Promise.resolve({ data: likeRows, error: null });
              },
            };
          },
        };
      }

      if (table === 'community_unit_comments') {
        return {
          upsert(payload, options) {
            calls.push({ table, action: 'upsert', payload, options });
            return Promise.resolve({ error: null });
          },
          select(selection) {
            calls.push({ table, action: 'select', selection });
            return {
              eq(column, value) {
                calls.push({ table, action: 'eq', column, value });
                return Promise.resolve({ data: commentRows, error: null });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };

  return { supabase, calls };
}

test('toggleUnitLikeForUser inserts and removes a per-user unit like', async () => {
  const insertMock = createLikeToggleSupabaseMock();
  const inserted = await toggleUnitLikeForUser(insertMock.supabase, 'user-1', {
    titleId: 'series:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'episode:1',
    unitLabel: 'Episode 1',
    unitHref: '/series/blue-lock/ep/1',
    mediaType: 'anime',
  });

  assert.equal(inserted, true);
  assert.deepEqual(insertMock.calls.at(-1), {
    table: 'community_unit_likes',
    action: 'upsert',
    payload: {
      user_id: 'user-1',
      title_id: 'series:blue-lock',
      title_label: 'Blue Lock',
      unit_id: 'episode:1',
      unit_label: 'Episode 1',
      unit_href: '/series/blue-lock/ep/1',
      media_type: 'anime',
      created_at: undefined,
      updated_at: undefined,
    },
    options: { onConflict: 'user_id,title_id,unit_id' },
  });

  const deleteMock = createLikeToggleSupabaseMock({
    existingLike: { id: 'like-1' },
  });
  const removed = await toggleUnitLikeForUser(deleteMock.supabase, 'user-1', {
    titleId: 'series:blue-lock',
    titleLabel: 'Blue Lock',
    unitId: 'episode:1',
    unitLabel: 'Episode 1',
    unitHref: '/series/blue-lock/ep/1',
    mediaType: 'anime',
  });

  assert.equal(removed, false);
  assert.equal(deleteMock.calls.some((call) => call.action === 'delete'), true);
});

test('syncLocalCommunityActivity upserts likes and comments with stable ids', async () => {
  const timestamp = Date.parse('2026-04-18T08:20:00.000Z');
  const { supabase, calls } = createCommunitySyncSupabaseMock({
    likeRows: [
      {
        id: 'series:blue-lock::episode:1',
        title_id: 'series:blue-lock',
        title_label: 'Blue Lock',
        unit_id: 'episode:1',
        unit_label: 'Episode 1',
        unit_href: '/series/blue-lock/ep/1',
        media_type: 'anime',
        created_at: '2026-04-18T08:20:00.000Z',
      },
    ],
    commentRows: [
      {
        id: 'comment-1',
        title_id: 'series:blue-lock',
        title_label: 'Blue Lock',
        unit_id: 'episode:1',
        unit_label: 'Episode 1',
        unit_href: '/series/blue-lock/ep/1',
        media_type: 'anime',
        author_name: 'Guest',
        content: 'Need a replay.',
        parent_id: null,
        created_at: '2026-04-18T08:20:00.000Z',
      },
    ],
  });

  const summary = await syncLocalCommunityActivity(supabase, 'user-1', {
    likes: [
      {
        id: 'series:blue-lock::episode:1',
        titleId: 'series:blue-lock',
        titleLabel: 'Blue Lock',
        unitId: 'episode:1',
        unitLabel: 'Episode 1',
        unitHref: '/series/blue-lock/ep/1',
        mediaType: 'anime',
        timestamp,
      },
    ],
    comments: [
      {
        id: 'comment-1',
        titleId: 'series:blue-lock',
        titleLabel: 'Blue Lock',
        unitId: 'episode:1',
        unitLabel: 'Episode 1',
        unitHref: '/series/blue-lock/ep/1',
        mediaType: 'anime',
        authorName: 'Guest',
        content: 'Need a replay.',
        parentId: null,
        timestamp,
      },
    ],
  });

  assert.deepEqual(calls[0], {
    table: 'community_unit_likes',
    action: 'upsert',
    payload: [
      {
        user_id: 'user-1',
        title_id: 'series:blue-lock',
        title_label: 'Blue Lock',
        unit_id: 'episode:1',
        unit_label: 'Episode 1',
        unit_href: '/series/blue-lock/ep/1',
        media_type: 'anime',
        created_at: '2026-04-18T08:20:00.000Z',
        updated_at: '2026-04-18T08:20:00.000Z',
      },
    ],
    options: { onConflict: 'user_id,title_id,unit_id' },
  });

  assert.deepEqual(calls[1], {
    table: 'community_unit_comments',
    action: 'upsert',
    payload: [
      {
        id: 'comment-1',
        user_id: 'user-1',
        title_id: 'series:blue-lock',
        title_label: 'Blue Lock',
        unit_id: 'episode:1',
        unit_label: 'Episode 1',
        unit_href: '/series/blue-lock/ep/1',
        media_type: 'anime',
        author_name: 'Guest',
        content: 'Need a replay.',
        parent_id: null,
        created_at: '2026-04-18T08:20:00.000Z',
        updated_at: '2026-04-18T08:20:00.000Z',
      },
    ],
    options: { onConflict: 'id' },
  });

  assert.deepEqual(summary, {
    likeCount: 1,
    commentCount: 1,
    activeTitleCount: 1,
    latestActivityAt: timestamp,
  });
});

test('getViewerCommunitySummary aggregates only the signed-in user activity', async () => {
  const timestamp = Date.parse('2026-04-18T08:30:00.000Z');
  const { supabase } = createCommunitySyncSupabaseMock({
    likeRows: [
      {
        id: 'movie:sharp-corner::movie:sharp-corner',
        title_id: 'movie:sharp-corner',
        title_label: 'Sharp Corner',
        unit_id: 'movie:sharp-corner',
        unit_label: 'Movie',
        unit_href: '/movies/sharp-corner',
        media_type: 'movie',
        created_at: '2026-04-18T08:30:00.000Z',
      },
    ],
    commentRows: [
      {
        id: 'comment-2',
        title_id: 'movie:sharp-corner',
        title_label: 'Sharp Corner',
        unit_id: 'movie:sharp-corner',
        unit_label: 'Movie',
        unit_href: '/movies/sharp-corner',
        media_type: 'movie',
        author_name: 'Dwi',
        content: 'Strong ending.',
        parent_id: null,
        created_at: '2026-04-18T08:30:00.000Z',
      },
    ],
  });

  const summary = await getViewerCommunitySummary(supabase, 'user-1');

  assert.deepEqual(summary, {
    likeCount: 1,
    commentCount: 1,
    activeTitleCount: 1,
    latestActivityAt: timestamp,
  });
});
