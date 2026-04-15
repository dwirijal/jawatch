import test from "node:test";
import assert from "node:assert/strict";

import {
  getOnboardingGateRedirectPath,
  normalizeVaultAwareNextPath,
  resolvePostAuthRedirectPath,
  shouldBypassProxyAuthGates,
} from "../../src/lib/auth/session.ts";

test("post-auth redirect sends incomplete users to onboarding", () => {
  assert.equal(resolvePostAuthRedirectPath("/vault/saved", false), "/onboarding");
});

test("post-auth redirect falls back to root when next path is missing", () => {
  assert.equal(resolvePostAuthRedirectPath(undefined, true), "/");
});

test("post-auth redirect keeps safe vault next path for completed users", () => {
  assert.equal(resolvePostAuthRedirectPath("/vault/history?tab=recent", true), "/vault/history?tab=recent");
});

test("post-auth redirect normalizes legacy collection next paths for completed users", () => {
  assert.equal(resolvePostAuthRedirectPath("/collection?tab=saved", true), "/vault/saved");
});

test("normalize next path maps legacy collection routes to vault saved", () => {
  assert.equal(normalizeVaultAwareNextPath("/collection"), "/vault/saved");
  assert.equal(normalizeVaultAwareNextPath("/collection?tab=saved"), "/vault/saved");
});

test("post-auth redirect sanitizes unsafe next path for completed users", () => {
  assert.equal(resolvePostAuthRedirectPath("https://evil.example.com", true), "/");
});

test("onboarding gate redirects incomplete protected requests", () => {
  assert.equal(getOnboardingGateRedirectPath("/vault/profile", false), "/onboarding");
});

test("onboarding gate does not redirect when already on onboarding route", () => {
  assert.equal(getOnboardingGateRedirectPath("/onboarding", false), null);
  assert.equal(getOnboardingGateRedirectPath("/onboarding/step", false), null);
  assert.equal(getOnboardingGateRedirectPath("/onboarding?step=identity", false), null);
});

test("onboarding gate does not redirect completed users", () => {
  assert.equal(getOnboardingGateRedirectPath("/vault/saved", true), null);
});

test("proxy bypass allows public files but not protected dotted paths", () => {
  assert.equal(shouldBypassProxyAuthGates("/movies/poster.jpg"), true);
  assert.equal(shouldBypassProxyAuthGates("/collection/foo.bar"), false);
  assert.equal(shouldBypassProxyAuthGates("/vault/saved"), false);
});
