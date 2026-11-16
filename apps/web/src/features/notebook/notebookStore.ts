import { useCallback, useSyncExternalStore } from "react";
import { emptyManual, parseManual, type ManualMarks } from "./notebookModel.js";

/**
 * Tiny external store over localStorage so every reader of the same notebook
 * key (the Notebook itself, open suggestion/accusation dialogs) re-renders on change.
 * Snapshots are cached per raw string so references stay stable for useSyncExternalStore.
 */
type Entry = { raw: string | null; state: ManualMarks };

const cache = new Map<string, Entry>();
/** Keys whose last write could not reach localStorage; served from memory only. */
const memoryOnly = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

function readRaw(key: string): string | null | undefined {
  try {
    return localStorage.getItem(key);
  } catch {
    return undefined;
  }
}

export function getNotebook(key: string): ManualMarks {
  const cached = cache.get(key);
  if (memoryOnly.has(key) && cached) return cached.state;
  const raw = readRaw(key);
  if (raw === undefined) return cached?.state ?? emptyManual;
  if (cached && cached.raw === raw) return cached.state;
  const state = parseManual(raw);
  cache.set(key, { raw, state });
  return state;
}

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function updateNotebook(key: string, fn: (s: ManualMarks) => ManualMarks): void {
  const prev = getNotebook(key);
  const next = fn(prev);
  if (next === prev) return;
  const raw = JSON.stringify(next);
  cache.set(key, { raw, state: next });
  try {
    localStorage.setItem(key, raw);
    memoryOnly.delete(key);
  } catch {
    memoryOnly.add(key);
  }
  notify(key);
}

export function subscribeNotebook(key: string, fn: () => void): () => void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** Current notebook state for `key`, re-rendering whenever any writer changes it. */
export function useManualMarks(key: string | null): ManualMarks {
  const subscribe = useCallback(
    (fn: () => void) => (key ? subscribeNotebook(key, fn) : () => {}),
    [key],
  );
  const snapshot = () => (key ? getNotebook(key) : emptyManual);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
