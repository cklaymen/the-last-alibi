/**
 * Boolean flags in localStorage ("1" / "0"). Every access is guarded:
 * when storage is unavailable or throws, reads return `null` and writes are dropped.
 */
export function readFlag(key: string): boolean | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}
