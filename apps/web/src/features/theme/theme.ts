import { useSyncExternalStore } from "react";

/**
 * Theme preference. Keep STORAGE_KEY and resolution in sync with the inline
 * script in index.html (it applies the theme before first paint).
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export const themePreferences: readonly ThemePreference[] = ["light", "dark", "system"];
export const THEME_STORAGE_KEY = "theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

export function parsePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

export function readPreference(): ThemePreference {
  try {
    return parsePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function systemDark(): boolean {
  return typeof matchMedia === "function" && matchMedia(DARK_QUERY).matches;
}

let current: ThemePreference = readPreference();

export function applyTheme(pref: ThemePreference = current): void {
  document.documentElement.dataset.theme = resolveTheme(pref, systemDark());
}

export function getThemePreference(): ThemePreference {
  return current;
}

export function setThemePreference(pref: ThemePreference): void {
  current = pref;
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable */
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

/** Re-applies the theme when the OS scheme changes (matters only for "system"). */
export function watchSystemTheme(): () => void {
  if (typeof matchMedia !== "function") return () => {};
  const media = matchMedia(DARK_QUERY);
  const onChange = () => applyTheme();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getThemePreference);
}
