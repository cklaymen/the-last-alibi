export interface ApiConfig {
  /** Base for HTTP calls, without a trailing slash (absolute URL or a path like "/api"). */
  apiUrl: string;
  /** First argument of io(). */
  socketUrl: string;
  /** Socket.IO `path` option; set only for a relative API URL (same-origin proxy). */
  socketPath: string | undefined;
}

/**
 * `VITE_API_URL` may be absolute (dev/e2e: "http://localhost:3000") or relative
 * (docker/nginx: "/api"). With a relative URL the socket connects to the page's
 * origin at "/socket.io", which the proxy forwards to the API.
 */
export function resolveApiConfig(raw: string | undefined, origin: string): ApiConfig {
  const value = (raw?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const relative = value === "" || value.startsWith("/");
  if (!relative) return { apiUrl: value, socketUrl: value, socketPath: undefined };
  return { apiUrl: value, socketUrl: origin, socketPath: "/socket.io" };
}

const config = resolveApiConfig(
  import.meta.env.VITE_API_URL as string | undefined,
  window.location.origin,
);

export const apiUrl: string = config.apiUrl;
export const socketUrl: string = config.socketUrl;
export const socketPath: string | undefined = config.socketPath;
