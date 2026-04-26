import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

function loadEnvFile(fileName) {
  const filePath = path.join(repoRoot, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (process.env[key]) {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function requireEnv(key) {
  const value = (process.env[key] || '').trim();
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

function randomSuffix() {
  return `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

function ok(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createTempUser(adminClient, anonKey, url, label) {
  const email = `codex-${label}-${randomSuffix()}@example.com`;
  const password = `T3st!${crypto.randomBytes(8).toString('hex')}`;

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    throw createError;
  }

  const authedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signedIn, error: signInError } = await authedClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw signInError;
  }

  ok(created.user?.id === signedIn.user?.id, `Signed-in user mismatch for ${label}`);

  return {
    id: created.user.id,
    email,
    authedClient,
  };
}

async function cleanupRows(adminClient, ids) {
  await adminClient.from('community_unit_comments').delete().eq('id', ids.commentId);
  await adminClient
    .from('community_unit_likes')
    .delete()
    .eq('user_id', ids.user1.id)
    .eq('title_id', ids.titleId)
    .eq('unit_id', ids.unitId);
  await adminClient
    .from('user_history')
    .delete()
    .eq('user_id', ids.user1.id)
    .eq('media_kind', 'anime')
    .eq('media_id', ids.mediaId)
    .eq('chapter_or_episode_id', ids.chapterId);
}

async function cleanupUsers(adminClient, users) {
  for (const user of users) {
    if (!user?.id) {
      continue;
    }

    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`WARN deleteUser ${user.email}: ${error.message}`);
    }
  }
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const users = [];
  const ids = {
    titleId: `smoke-title-${randomSuffix()}`,
    unitId: `smoke-unit-${randomSuffix()}`,
    mediaId: `smoke-media-${randomSuffix()}`,
    chapterId: `smoke-episode-${randomSuffix()}`,
    commentId: `smoke-comment-${randomSuffix()}`,
  };

  try {
    const user1 = await createTempUser(adminClient, anonKey, url, 'history');
    const user2 = await createTempUser(adminClient, anonKey, url, 'viewer');
    users.push(user1, user2);

    ids.user1 = user1;
    ids.user2 = user2;

    const historyRow = {
      user_id: user1.id,
      media_kind: 'anime',
      media_id: ids.mediaId,
      chapter_or_episode_id: ids.chapterId,
      title: 'Supabase Smoke Title',
      image_url: 'https://example.com/poster.jpg',
      unit_label: 'Episode 1',
      unit_href: '/series/smoke/ep/1',
      last_seen_at: new Date().toISOString(),
    };

    const historyUpsert = await user1.authedClient
      .from('user_history')
      .upsert(historyRow, { onConflict: 'user_id,media_kind,media_id,chapter_or_episode_id' })
      .select('user_id,media_id,title,image_url,unit_label,unit_href');
    ok(!historyUpsert.error, `History upsert failed: ${historyUpsert.error?.message}`);
    ok((historyUpsert.data || []).length === 1, 'History upsert did not return one row');

    const historyRead = await user1.authedClient
      .from('user_history')
      .select('user_id,media_id,title,image_url,unit_label,unit_href')
      .eq('media_id', ids.mediaId);
    ok(!historyRead.error, `History read failed: ${historyRead.error?.message}`);
    ok(historyRead.data?.[0]?.title === historyRow.title, 'History title mismatch after read');

    const isolatedHistoryRead = await user2.authedClient
      .from('user_history')
      .select('user_id,media_id')
      .eq('media_id', ids.mediaId);
    ok(!isolatedHistoryRead.error, `History isolation read failed: ${isolatedHistoryRead.error?.message}`);
    ok((isolatedHistoryRead.data || []).length === 0, 'History row leaked across users');

    const likeUpsert = await user1.authedClient
      .from('community_unit_likes')
      .upsert(
        {
          user_id: user1.id,
          title_id: ids.titleId,
          title_label: 'Supabase Smoke Title',
          unit_id: ids.unitId,
          unit_label: 'Episode 1',
          unit_href: '/series/smoke/ep/1',
          media_type: 'anime',
        },
        { onConflict: 'user_id,title_id,unit_id' },
      )
      .select('user_id,title_id,unit_id');
    ok(!likeUpsert.error, `Like upsert failed: ${likeUpsert.error?.message}`);
    ok((likeUpsert.data || []).length === 1, 'Like upsert did not return one row');

    const likeCrossRead = await user2.authedClient
      .from('community_unit_likes')
      .select('user_id,title_id,unit_id')
      .eq('title_id', ids.titleId)
      .eq('unit_id', ids.unitId);
    ok(!likeCrossRead.error, `Like cross-read failed: ${likeCrossRead.error?.message}`);
    ok((likeCrossRead.data || []).length === 1, 'Authenticated user could not read public like row');

    const likeForeignDelete = await user2.authedClient
      .from('community_unit_likes')
      .delete()
      .eq('user_id', user1.id)
      .eq('title_id', ids.titleId)
      .eq('unit_id', ids.unitId);
    ok(!likeForeignDelete.error, `Like foreign delete errored unexpectedly: ${likeForeignDelete.error?.message}`);

    const likeStillThere = await user1.authedClient
      .from('community_unit_likes')
      .select('user_id,title_id,unit_id')
      .eq('title_id', ids.titleId)
      .eq('unit_id', ids.unitId);
    ok((likeStillThere.data || []).length === 1, 'Foreign user unexpectedly removed like row');

    const commentUpsert = await user1.authedClient
      .from('community_unit_comments')
      .upsert(
        {
          id: ids.commentId,
          user_id: user1.id,
          title_id: ids.titleId,
          title_label: 'Supabase Smoke Title',
          unit_id: ids.unitId,
          unit_label: 'Episode 1',
          unit_href: '/series/smoke/ep/1',
          media_type: 'anime',
          author_name: 'Codex Smoke',
          content: 'Supabase personalization smoke comment',
          parent_id: null,
        },
        { onConflict: 'id' },
      )
      .select('id,user_id,title_id,unit_id,content');
    ok(!commentUpsert.error, `Comment upsert failed: ${commentUpsert.error?.message}`);
    ok((commentUpsert.data || []).length === 1, 'Comment upsert did not return one row');

    const commentCrossRead = await user2.authedClient
      .from('community_unit_comments')
      .select('id,user_id,title_id,unit_id,content')
      .eq('id', ids.commentId);
    ok(!commentCrossRead.error, `Comment cross-read failed: ${commentCrossRead.error?.message}`);
    ok((commentCrossRead.data || []).length === 1, 'Authenticated user could not read public comment row');

    const commentForeignDelete = await user2.authedClient
      .from('community_unit_comments')
      .delete()
      .eq('id', ids.commentId);
    ok(!commentForeignDelete.error, `Comment foreign delete errored unexpectedly: ${commentForeignDelete.error?.message}`);

    const commentStillThere = await user1.authedClient
      .from('community_unit_comments')
      .select('id,user_id,title_id,unit_id')
      .eq('id', ids.commentId);
    ok((commentStillThere.data || []).length === 1, 'Foreign user unexpectedly removed comment row');

    console.log('PASS user_history own-write/own-read policy');
    console.log('PASS user_history isolation across users');
    console.log('PASS community_unit_likes authenticated cross-read policy');
    console.log('PASS community_unit_likes foreign delete blocked by RLS');
    console.log('PASS community_unit_comments authenticated cross-read policy');
    console.log('PASS community_unit_comments foreign delete blocked by RLS');
  } finally {
    await cleanupRows(adminClient, ids).catch((error) => {
      console.error(`WARN cleanup rows: ${error instanceof Error ? error.message : String(error)}`);
    });
    await cleanupUsers(adminClient, users);
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
