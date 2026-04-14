import test from "node:test";
import assert from "node:assert/strict";

import {
  getOnboardingGateRedirectPath,
  resolvePostAuthRedirectPath,
  shouldBypassProxyAuthGates,
} from "../../src/lib/auth/session.ts";

test("post-auth redirect sends incomplete users to onboarding", () => {
  assert.equal(resolvePostAuthRedirectPath("/collection", false), "/onboarding");
});

test("post-auth redirect falls back to root when next path is missing", () => {
  assert.equal(resolvePostAuthRedirectPath(undefined, true), "/");
});

test("post-auth redirect keeps safe next path for completed users", () => {
  assert.equal(resolvePostAuthRedirectPath("/collection?tab=saved", true), "/collection?tab=saved");
});

test("post-auth redirect sanitizes unsafe next path for completed users", () => {
  assert.equal(resolvePostAuthRedirectPath("https://evil.example.com", true), "/");
});

test("onboarding gate redirects incomplete protected requests", () => {
  assert.equal(getOnboardingGateRedirectPath("/account/age", false), "/onboarding");
});

test("onboarding gate does not redirect when already on onboarding route", () => {
  assert.equal(getOnboardingGateRedirectPath("/onboarding", false), null);
  assert.equal(getOnboardingGateRedirectPath("/onboarding/step", false), null);
  assert.equal(getOnboardingGateRedirectPath("/onboarding?step=identity", false), null);
});

test("onboarding gate does not redirect completed users", () => {
  assert.equal(getOnboardingGateRedirectPath("/collection", true), null);
});

test("proxy bypass allows public files but not protected dotted paths", () => {
  assert.equal(shouldBypassProxyAuthGates("/movies/poster.jpg"), true);
  assert.equal(shouldBypassProxyAuthGates("/collection/foo.bar"), false);
});
