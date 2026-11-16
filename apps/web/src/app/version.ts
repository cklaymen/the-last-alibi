/**
 * Build version shown on the home screen: build time in UTC, ISO 8601 with minute
 * precision (e.g. `2026-11-16T14:32Z`), optionally followed by a short commit hash.
 */
export function formatBuildVersion(isoUtc: Date, sha?: string): string {
  const stamp = `${isoUtc.toISOString().slice(0, 16)}Z`;
  const shortSha = sha?.trim();
  return shortSha ? `${stamp} (${shortSha})` : stamp;
}
