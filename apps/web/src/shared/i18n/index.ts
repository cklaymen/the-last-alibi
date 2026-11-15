import { useSyncExternalStore } from "react";

/**
 * Minimal i18n. Each feature defines its own dictionary with `defineMessages`
 * (`pl` must have exactly the shape of `en`) and reads it with `useT(messages)`.
 */
export type Locale = "en" | "pl";
export const locales: readonly Locale[] = ["en", "pl"];

const STORAGE_KEY = "locale";
const listeners = new Set<() => void>();

function detect(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pl") return stored;
  } catch {
    /* storage unavailable */
  }
  return navigator.language.toLowerCase().startsWith("pl") ? "pl" : "en";
}

let current: Locale = detect();
document.documentElement.lang = current;

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale);
}

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Messages<T extends Record<string, string>> = { en: T; pl: Widen<T> };

export function defineMessages<const T extends Record<string, string>>(
  messages: { en: T; pl: { [K in keyof T]: string } },
): Messages<T> {
  return messages as Messages<T>;
}

/** Replaces `{name}` placeholders. */
export function format(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

/** Translator bound to one feature dictionary; re-renders on locale change. */
export function useT<T extends Record<string, string>>(messages: Messages<T>) {
  const locale = useLocale();
  return (key: keyof T & string, params?: Record<string, string | number>) =>
    format((messages[locale] as Record<string, string>)[key] ?? key, params);
}

/** Non-hook variant (for code outside components). */
export function translate<T extends Record<string, string>>(
  messages: Messages<T>,
  key: keyof T & string,
  params?: Record<string, string | number>,
): string {
  return format((messages[current] as Record<string, string>)[key] ?? key, params);
}
