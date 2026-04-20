import { readStoredString, writeStoredString } from './browser-storage.ts';

export const COLOR_MODE_STORAGE_KEY = "jawatch-color-mode";

export type ColorModePreference = "system" | "light" | "dark";
export type ResolvedColorMode = "light" | "dark";

declare global {
  interface Window {
    __jawatchSetColorModePreference?: (preference: ColorModePreference) => void;
  }
}

export function isColorModePreference(value: unknown): value is ColorModePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveColorMode(
  preference: ColorModePreference,
  prefersDark: boolean,
): ResolvedColorMode {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  return preference;
}

export function getSystemColorMode(): ResolvedColorMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredColorMode(): ColorModePreference {
  const stored = readStoredString(COLOR_MODE_STORAGE_KEY);
  return isColorModePreference(stored) ? stored : "system";
}

function emitColorModeEvent(preference: ColorModePreference, resolved: ResolvedColorMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("jawatch:color-mode-change", {
      detail: { preference, resolved },
    }),
  );
}

export function applyColorModePreference(
  preference: ColorModePreference,
  options?: { persist?: boolean },
): ResolvedColorMode {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return "light";
  }

  const resolved = resolveColorMode(
    preference,
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const root = document.documentElement;

  root.dataset.colorPreference = preference;
  root.dataset.colorMode = resolved;
  root.style.colorScheme = resolved;

  if (options?.persist !== false) {
    writeStoredString(COLOR_MODE_STORAGE_KEY, preference);
  }

  emitColorModeEvent(preference, resolved);
  return resolved;
}

export function getDocumentColorModeState(): {
  preference: ColorModePreference;
  resolved: ResolvedColorMode;
} {
  if (typeof document === "undefined") {
    return {
      preference: "system",
      resolved: "light",
    };
  }

  const root = document.documentElement;
  const preference = isColorModePreference(root.dataset.colorPreference)
    ? root.dataset.colorPreference
    : "system";
  const resolved = root.dataset.colorMode === "dark" ? "dark" : "light";

  return { preference, resolved };
}

export function getColorModeBootstrapScript() {
  return `
    (function () {
      var key = ${JSON.stringify(COLOR_MODE_STORAGE_KEY)};
      var root = document.documentElement;
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var isPreference = function (value) {
        return value === "system" || value === "light" || value === "dark";
      };
      var readPreference = function () {
        try {
          var stored = window.localStorage.getItem(key);
          return isPreference(stored) ? stored : "system";
        } catch (error) {
          return "system";
        }
      };
      var resolve = function (preference) {
        if (preference === "system") {
          return mq.matches ? "dark" : "light";
        }
        return preference;
      };
      var apply = function (preference, persist) {
        var resolved = resolve(preference);
        root.dataset.colorPreference = preference;
        root.dataset.colorMode = resolved;
        root.style.colorScheme = resolved;
        if (persist !== false) {
          try {
            window.localStorage.setItem(key, preference);
          } catch (error) {}
        }
        window.dispatchEvent(
          new CustomEvent("jawatch:color-mode-change", {
            detail: { preference: preference, resolved: resolved },
          })
        );
        return resolved;
      };
      var syncSystem = function () {
        if ((root.dataset.colorPreference || "system") === "system") {
          apply("system", false);
        }
      };

      apply(readPreference(), false);
      if (mq.addEventListener) {
        mq.addEventListener("change", syncSystem);
      } else if (mq.addListener) {
        mq.addListener(syncSystem);
      }

      window.__jawatchSetColorModePreference = function (preference) {
        return apply(isPreference(preference) ? preference : "system");
      };
    })();
  `;
}
