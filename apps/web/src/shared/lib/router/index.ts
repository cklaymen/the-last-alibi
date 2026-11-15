import { useMemo, useSyncExternalStore } from "react";

/**
 * Tiny History-API router: two routes, `/` and `/room/<code>`.
 * `navigate()` notifies subscribers; `popstate` (back/forward) does too.
 */
export type Route = { name: "home" } | { name: "room"; code: string };

const ROOM_PATH = /^\/room\/(\d{4,6})\/?$/;

export function parseRoute(pathname: string): Route {
  const match = ROOM_PATH.exec(pathname);
  return match ? { name: "room", code: match[1]! } : { name: "home" };
}

export const homePath = "/";
export const roomPath = (code: string) => `/room/${encodeURIComponent(code)}`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function navigate(path: string, { replace = false }: { replace?: boolean } = {}): void {
  if (path === window.location.pathname) return;
  if (replace) window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("popstate", notify);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("popstate", notify);
  };
}

const getPathname = () => window.location.pathname;

/** The current route; re-renders on navigate() and back/forward. */
export function useRoute(): Route {
  const pathname = useSyncExternalStore(subscribe, getPathname);
  return useMemo(() => parseRoute(pathname), [pathname]);
}
