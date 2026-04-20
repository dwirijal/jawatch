import test from "node:test";
import assert from "node:assert/strict";

import {
  getOnboardingStatus,
  isOnboardingComplete,
  replaceMediaPreferences,
  saveAgeAccessFields,
} from "../../src/lib/onboarding/server.ts";
import { setProfileAdultFields } from "../../src/lib/auth/profile.ts";
import { setAdultContentChoice } from "../../src/lib/server/user-preferences.ts";

function createOnboardingStatusSupabaseMock({
  profileRow,
  preferenceRow,
  mediaRows = [],
  genreRows = [],
  titleSeedRows = [],
} = {}) {
  const calls = [];

  function from(table) {
    if (table === "profiles") {
      return {
        select(selection) {
          calls.push({ table, action: "select", selection });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return {
                async maybeSingle() {
                  calls.push({ table, action: "maybeSingle" });
                  return { data: profileRow ?? null, error: null };
                },
              };
            },
          };
        },
      };
    }

    if (table === "user_preferences") {
      return {
        select(selection) {
          calls.push({ table, action: "select", selection });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return {
                async maybeSingle() {
                  calls.push({ table, action: "maybeSingle" });
                  return { data: preferenceRow ?? null, error: null };
                },
              };
            },
          };
        },
        upsert(payload, options) {
          calls.push({ table, action: "upsert", payload, options });
          return {
            select(selection) {
              calls.push({ table, action: "select", selection });
              return {
                async single() {
                  calls.push({ table, action: "single" });
                  const adultContentEnabled = Boolean(payload.adult_content_enabled);
                  return {
                    data: {
                      user_id: payload.user_id,
                      adult_content_enabled: adultContentEnabled,
                      adult_content_choice_set_at:
                        payload.adult_content_choice_set_at ?? new Date("2026-04-12T00:00:00.000Z").toISOString(),
                      newsletter_opt_in: false,
                      community_opt_in: false,
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    }

    if (table === "user_media_preferences") {
      return {
        select(selection) {
          calls.push({ table, action: "select", selection });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return Promise.resolve({ data: mediaRows, error: null });
            },
          };
        },
        delete() {
          calls.push({ table, action: "delete" });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return Promise.resolve({ error: null });
            },
          };
        },
        insert(payload) {
          calls.push({ table, action: "insert", payload });
          return {
            select(selection) {
              calls.push({ table, action: "select", selection });
              return Promise.resolve({ data: payload, error: null });
            },
          };
        },
      };
    }

    if (table === "user_genre_preferences") {
      return {
        select(selection) {
          calls.push({ table, action: "select", selection });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return Promise.resolve({ data: genreRows, error: null });
            },
          };
        },
      };
    }

    if (table === "user_title_seeds") {
      return {
        select(selection) {
          calls.push({ table, action: "select", selection });
          return {
            eq(column, value) {
              calls.push({ table, action: "eq", column, value });
              return Promise.resolve({ data: titleSeedRows, error: null });
            },
          };
        },
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  }

  return { supabase: { from }, calls };
}

function createAgeAccessSupabaseMock() {
  const calls = [];
  const nowIso = new Date("2026-04-12T00:00:00.000Z").toISOString();
  const profileRow = {
    id: "user_age",
    birth_date: "2000-01-10",
    age_verified_at: nowIso,
  };
  const preferenceRow = {
    user_id: "user_age",
    adult_content_enabled: true,
    adult_content_choice_set_at: nowIso,
    newsletter_opt_in: false,
    community_opt_in: false,
  };

  const supabase = {
    from(table) {
      if (table === "profiles") {
        return {
          upsert(payload, options) {
            calls.push({ table, action: "upsert", payload, options });
            return {
              select(selection) {
                calls.push({ table, action: "select", selection });
                return {
                  async single() {
                    calls.push({ table, action: "single" });
                    return { data: profileRow, error: null };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "user_preferences") {
        return {
          upsert(payload, options) {
            calls.push({ table, action: "upsert", payload, options });
            return {
              select(selection) {
                calls.push({ table, action: "select", selection });
                return {
                  async single() {
                    calls.push({ table, action: "single" });
                    return {
                      data: {
                        ...preferenceRow,
                        user_id: payload.user_id,
                        adult_content_enabled: Boolean(payload.adult_content_enabled),
                        adult_content_choice_set_at: payload.adult_content_choice_set_at ?? nowIso,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table in age access mock: ${table}`);
    },
  };

  return { supabase, calls };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

test("onboarding is incomplete when display name is blank", () => {
  assert.equal(
    isOnboardingComplete({
      displayName: "",
      birthDate: "2000-01-01",
      adultChoiceSaved: true,
      onboardingCompletedAt: "2026-04-12T00:00:00.000Z",
    }),
    false,
  );
});

test("onboarding is incomplete when onboardingCompletedAt is malformed", () => {
  assert.equal(
    isOnboardingComplete({
      displayName: "Valid Name",
      birthDate: "2000-01-01",
      adultChoiceSaved: true,
      onboardingCompletedAt: "not-a-timestamp",
    }),
    false,
  );
});

test("invalid birth date is rejected by age-access saver", async () => {
  const { supabase } = createAgeAccessSupabaseMock();

  await assert.rejects(
    saveAgeAccessFields(supabase, "user_age", {
      birthDate: "not-a-date",
      adultContentEnabled: true,
    }),
    /Invalid birth date/,
  );
});

test("today birth date is rejected by age-access saver", async () => {
  const { supabase } = createAgeAccessSupabaseMock();
  const todayIso = new Date().toISOString().slice(0, 10);

  await assert.rejects(
    saveAgeAccessFields(supabase, "user_age", {
      birthDate: todayIso,
      adultContentEnabled: true,
    }),
    /Invalid birth date/,
  );
});

test("setProfileAdultFields allows today birth date for account age flow", async () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date("2026-04-12T00:00:00.000Z").toISOString();
  const supabase = {
    from(table) {
      assert.equal(table, "profiles");
      return {
        upsert(payload, options) {
          assert.equal(payload.birth_date, todayIso);
          assert.deepEqual(options, { onConflict: "id" });
          return {
            select(selection) {
              assert.equal(selection, "id,birth_date,age_verified_at");
              return {
                async single() {
                  return {
                    data: {
                      id: payload.id,
                      birth_date: payload.birth_date,
                      age_verified_at: payload.age_verified_at ?? nowIso,
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await setProfileAdultFields(supabase, {
    userId: "user_account_age",
    birthDate: todayIso,
  });

  assert.equal(result.birthDate, todayIso);
  assert.ok(result.ageVerifiedAt);
});

test("adult-content choice is persisted with explicit choice timestamp", async () => {
  const { supabase, calls } = createAgeAccessSupabaseMock();

  await saveAgeAccessFields(supabase, "user_age", {
    birthDate: "2000-01-10",
    adultContentEnabled: true,
  });

  const preferenceUpsert = calls.find(
    (call) => call.table === "user_preferences" && call.action === "upsert",
  );
  assert.ok(preferenceUpsert);
  assert.equal(preferenceUpsert.payload.user_id, "user_age");
  assert.equal(preferenceUpsert.payload.adult_content_enabled, true);
  assert.ok(preferenceUpsert.payload.adult_content_choice_set_at);
});

test("adult-content completion requires adult_content_choice_set_at", async () => {
  const { supabase } = createOnboardingStatusSupabaseMock({
    profileRow: {
      id: "user_1",
      display_name: "First User",
      birth_date: "2000-01-10",
      onboarding_completed_at: "2026-04-12T00:00:00.000Z",
    },
    preferenceRow: {
      user_id: "user_1",
      adult_content_enabled: true,
      adult_content_choice_set_at: null,
      newsletter_opt_in: false,
      community_opt_in: false,
    },
  });

  const status = await getOnboardingStatus(supabase, "user_1");
  assert.equal(status.adultChoiceSaved, false);
  assert.equal(status.complete, false);
});

test("adult-content completion ignores malformed choice timestamp", async () => {
  const { supabase } = createOnboardingStatusSupabaseMock({
    profileRow: {
      id: "user_invalid_choice",
      display_name: "Invalid Choice",
      birth_date: "2000-01-10",
      onboarding_completed_at: "2026-04-12T00:00:00.000Z",
    },
    preferenceRow: {
      user_id: "user_invalid_choice",
      adult_content_enabled: true,
      adult_content_choice_set_at: "not-a-timestamp",
      newsletter_opt_in: false,
      community_opt_in: false,
    },
  });

  const status = await getOnboardingStatus(supabase, "user_invalid_choice");
  assert.equal(status.adultChoiceSaved, false);
  assert.equal(status.complete, false);
});

test("nsfw eligibility remains derived from age >= 21 and adult_content_enabled", async () => {
  const { supabase } = createOnboardingStatusSupabaseMock({
    profileRow: {
      id: "user_2",
      display_name: "Second User",
      birth_date: "2010-01-10",
      onboarding_completed_at: "2026-04-12T00:00:00.000Z",
    },
    preferenceRow: {
      user_id: "user_2",
      adult_content_enabled: true,
      adult_content_choice_set_at: "2026-04-12T00:00:00.000Z",
      newsletter_opt_in: false,
      community_opt_in: false,
    },
  });

  const status = await getOnboardingStatus(supabase, "user_2", new Date("2026-04-12T00:00:00.000Z"));
  assert.equal(status.adultContentEnabled, true);
  assert.equal(status.age, 16);
  assert.equal(status.canAccessNsfw, false);
});

test("onboarding completion stays false without required fields", async () => {
  const { supabase } = createOnboardingStatusSupabaseMock({
    profileRow: {
      id: "user_3",
      display_name: "Third User",
      birth_date: null,
      onboarding_completed_at: "2026-04-12T00:00:00.000Z",
    },
    preferenceRow: {
      user_id: "user_3",
      adult_content_enabled: false,
      adult_content_choice_set_at: "2026-04-12T00:00:00.000Z",
      newsletter_opt_in: false,
      community_opt_in: false,
    },
  });

  const status = await getOnboardingStatus(supabase, "user_3");
  assert.equal(status.complete, false);
});

test("onboarding status starts supplemental preference queries in parallel", async () => {
  const startedTables = [];
  const mediaDeferred = createDeferred();
  const genreDeferred = createDeferred();
  const titleSeedDeferred = createDeferred();

  const supabase = {
    from(table) {
      if (table === "profiles") {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: {
                        id: "user_parallel",
                        display_name: "Parallel User",
                        birth_date: "2000-01-10",
                        onboarding_completed_at: "2026-04-12T00:00:00.000Z",
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "user_preferences") {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: {
                        user_id: "user_parallel",
                        adult_content_enabled: true,
                        adult_content_choice_set_at: "2026-04-12T00:00:00.000Z",
                        newsletter_opt_in: false,
                        community_opt_in: false,
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "user_media_preferences") {
        return {
          select() {
            return {
              eq() {
                startedTables.push(table);
                return mediaDeferred.promise;
              },
            };
          },
        };
      }

      if (table === "user_genre_preferences") {
        return {
          select() {
            return {
              eq() {
                startedTables.push(table);
                return genreDeferred.promise;
              },
            };
          },
        };
      }

      if (table === "user_title_seeds") {
        return {
          select() {
            return {
              eq() {
                startedTables.push(table);
                return titleSeedDeferred.promise;
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  const statusPromise = getOnboardingStatus(supabase, "user_parallel");

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(
    [...new Set(startedTables)].sort(),
    ["user_genre_preferences", "user_media_preferences", "user_title_seeds"],
  );

  mediaDeferred.resolve({ data: [], error: null });
  genreDeferred.resolve({ data: [], error: null });
  titleSeedDeferred.resolve({ data: [], error: null });

  const status = await statusPromise;
  assert.equal(status.userId, "user_parallel");
});

test("media preference replacement uses own-row user_id filter shape", async () => {
  const { supabase, calls } = createOnboardingStatusSupabaseMock();

  await replaceMediaPreferences(supabase, "user_self", ["movies", "series"]);

  const deleteIndex = calls.findIndex(
    (call) => call.table === "user_media_preferences" && call.action === "delete",
  );
  assert.notEqual(deleteIndex, -1);
  assert.deepEqual(calls[deleteIndex + 1], {
    table: "user_media_preferences",
    action: "eq",
    column: "user_id",
    value: "user_self",
  });

  const insertCall = calls.find(
    (call) => call.table === "user_media_preferences" && call.action === "insert",
  );
  assert.ok(insertCall);
  assert.equal(insertCall.payload[0].user_id, "user_self");
  assert.equal(insertCall.payload[1].user_id, "user_self");
});

test("setAdultContentChoice rejects blank timestamp override", async () => {
  const supabase = {
    from(table) {
      assert.equal(table, "user_preferences");
      return {
        upsert() {
          throw new Error("should not upsert when timestamp override is invalid");
        },
      };
    },
  };

  await assert.rejects(
    setAdultContentChoice(supabase, "user_choice_blank", {
      adultContentEnabled: true,
      adultContentChoiceSetAt: "   ",
    }),
    /Invalid adult choice timestamp/,
  );
});

test("setAdultContentChoice rejects invalid timestamp override", async () => {
  const supabase = {
    from(table) {
      assert.equal(table, "user_preferences");
      return {
        upsert() {
          throw new Error("should not upsert when timestamp override is invalid");
        },
      };
    },
  };

  await assert.rejects(
    setAdultContentChoice(supabase, "user_choice_invalid", {
      adultContentEnabled: false,
      adultContentChoiceSetAt: "2026-99-99T00:00:00.000Z",
    }),
    /Invalid adult choice timestamp/,
  );
});
