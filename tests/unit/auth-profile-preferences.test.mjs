import test from "node:test";
import assert from "node:assert/strict";

import { bootstrapProfileForUser, toProfileUpsertRow } from "../../src/lib/auth/profile.ts";
import { getOrCreateUserPreferences } from "../../src/lib/server/user-preferences.ts";

test("normalizes profile bootstrap row from Supabase metadata", () => {
  const row = toProfileUpsertRow({
    id: "u_123",
    email: "jawatch@example.com",
    user_metadata: {
      full_name: "Jawatch User",
      picture: "https://cdn.example.com/avatar.jpg",
    },
    app_metadata: {
      provider: "discord",
    },
    identities: [{ provider: "google" }],
  });

  assert.deepEqual(row, {
    id: "u_123",
    email: "jawatch@example.com",
    display_name: "Jawatch User",
    avatar_url: "https://cdn.example.com/avatar.jpg",
    provider: "discord",
  });
});

test("falls back to identity provider when app metadata provider is absent", () => {
  const row = toProfileUpsertRow({
    id: "u_234",
    email: "provider-fallback@example.com",
    user_metadata: {},
    app_metadata: {},
    identities: [{ provider: "google" }],
  });

  assert.equal(row.provider, "google");
  assert.equal(row.display_name, "provider-fallback");
});

test("bootstraps profile via upsert into shared profiles table", async () => {
  const calls = [];
  const supabase = {
    from(table) {
      assert.equal(table, "profiles");
      return {
        async upsert(payload, options) {
          calls.push({ payload, options });
          return { error: null };
        },
      };
    },
  };

  const row = await bootstrapProfileForUser(supabase, {
    id: "u_345",
    email: "upsert@example.com",
    user_metadata: { name: "Upsert User" },
    app_metadata: { provider: "google" },
    identities: [],
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    payload: row,
    options: { onConflict: "id" },
  });
  assert.equal(row.display_name, "Upsert User");
  assert.equal(row.provider, "google");
});

function createPreferencesSupabaseMock({
  initialRow = null,
  insertedRow = null,
  insertError = null,
  readAfterInsertRow = null,
}) {
  let readCount = 0;
  const state = {
    insertPayloads: [],
  };

  const supabase = {
    from(table) {
      assert.equal(table, "user_preferences");
      return {
        select(selection) {
          assert.equal(selection, "user_id,adult_content_enabled,subtitle_locale,theme");
          return {
            eq(column, userId) {
              assert.equal(column, "user_id");
              assert.equal(typeof userId, "string");
              return {
                async maybeSingle() {
                  readCount += 1;
                  if (readCount === 1) {
                    return { data: initialRow, error: null };
                  }
                  return { data: readAfterInsertRow, error: null };
                },
              };
            },
          };
        },
        insert(payload) {
          state.insertPayloads.push(payload);
          return {
            select(selection) {
              assert.equal(selection, "user_id,adult_content_enabled,subtitle_locale,theme");
              return {
                async single() {
                  return { data: insertedRow, error: insertError };
                },
              };
            },
          };
        },
      };
    },
  };

  return { supabase, state };
}

test("returns existing user_preferences without insert", async () => {
  const existing = {
    user_id: "u_901",
    adult_content_enabled: true,
    subtitle_locale: "id-ID",
    theme: "anime",
  };
  const { supabase, state } = createPreferencesSupabaseMock({ initialRow: existing });

  const preferences = await getOrCreateUserPreferences(supabase, "u_901");

  assert.equal(state.insertPayloads.length, 0);
  assert.deepEqual(preferences, {
    userId: "u_901",
    adultContentEnabled: true,
    subtitleLocale: "id-ID",
    theme: "anime",
  });
});

test("lazily creates default user_preferences when missing", async () => {
  const inserted = {
    user_id: "u_902",
    adult_content_enabled: false,
    subtitle_locale: null,
    theme: null,
  };
  const { supabase, state } = createPreferencesSupabaseMock({ insertedRow: inserted });

  const preferences = await getOrCreateUserPreferences(supabase, "u_902");

  assert.equal(state.insertPayloads.length, 1);
  assert.deepEqual(state.insertPayloads[0], {
    user_id: "u_902",
    adult_content_enabled: false,
    subtitle_locale: null,
    theme: null,
  });
  assert.deepEqual(preferences, {
    userId: "u_902",
    adultContentEnabled: false,
    subtitleLocale: null,
    theme: null,
  });
});

test("handles concurrent preference creation race by reading winner row", async () => {
  const winner = {
    user_id: "u_903",
    adult_content_enabled: false,
    subtitle_locale: "en-US",
    theme: "cinema",
  };
  const { supabase, state } = createPreferencesSupabaseMock({
    insertedRow: null,
    insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
    readAfterInsertRow: winner,
  });

  const preferences = await getOrCreateUserPreferences(supabase, "u_903");

  assert.equal(state.insertPayloads.length, 1);
  assert.deepEqual(preferences, {
    userId: "u_903",
    adultContentEnabled: false,
    subtitleLocale: "en-US",
    theme: "cinema",
  });
});
