import test from 'node:test';
import assert from 'node:assert/strict';

import { syncUserHistory } from '../../src/lib/server/history-store.ts';

function createHistorySupabaseMock({ selectRows = [] } = {}) {
  const calls = [];

  const supabase = {
    from(table) {
      assert.equal(table, 'user_history');

      return {
        async upsert(payload, options) {
          calls.push({ table, action: 'upsert', payload, options });
          return { error: null };
        },
        select(selection) {
          calls.push({ table, action: 'select', selection });
          return {
            eq(column, value) {
              calls.push({ table, action: 'eq', column, value });
              return {
                order(orderColumn, options) {
                  calls.push({ table, action: 'order', column: orderColumn, options });
                  return Promise.resolve({ data: selectRows, error: null });
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

test('syncUserHistory upserts UI-facing history fields and returns merged rows', async () => {
  const timestamp = Date.parse('2026-04-18T08:00:00.000Z');
  const { supabase, calls } = createHistorySupabaseMock({
    selectRows: [
      {
        user_id: 'user-1',
        media_kind: 'manga',
        media_id: 'blue-lock',
        chapter_or_episode_id: '/comics/blue-lock/chapters/chapter-12',
        title: 'Blue Lock',
        image_url: '/blue-lock.jpg',
        unit_label: 'Chapter 12',
        unit_href: '/comics/blue-lock/chapters/chapter-12',
        last_seen_at: '2026-04-18T08:00:00.000Z',
      },
    ],
  });

  const result = await syncUserHistory(supabase, 'user-1', [
    {
      id: 'blue-lock',
      type: 'manga',
      title: 'Blue Lock',
      image: '/blue-lock.jpg',
      lastChapterOrEpisode: 'Chapter 12',
      lastLink: '/comics/blue-lock/chapters/chapter-12',
      timestamp,
    },
  ]);

  assert.deepEqual(calls[0], {
    table: 'user_history',
    action: 'upsert',
    payload: [
      {
        user_id: 'user-1',
        media_kind: 'manga',
        media_id: 'blue-lock',
        chapter_or_episode_id: '/comics/blue-lock/chapters/chapter-12',
        title: 'Blue Lock',
        image_url: '/blue-lock.jpg',
        unit_label: 'Chapter 12',
        unit_href: '/comics/blue-lock/chapters/chapter-12',
        progress_seconds: null,
        progress_percent: null,
        last_seen_at: '2026-04-18T08:00:00.000Z',
      },
    ],
    options: {
      onConflict: 'user_id,media_kind,media_id,chapter_or_episode_id',
    },
  });

  assert.deepEqual(result, [
    {
      id: 'blue-lock',
      type: 'manga',
      title: 'Blue Lock',
      image: '/blue-lock.jpg',
      lastChapterOrEpisode: 'Chapter 12',
      lastLink: '/comics/blue-lock/chapters/chapter-12',
      timestamp,
    },
  ]);
});
