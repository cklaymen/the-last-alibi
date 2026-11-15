/** The nickname this browser used last; pre-fills every nickname field. */
export const NICKNAME_KEY = "nickname";

export function loadNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNickname(name: string): void {
  const value = name.trim();
  if (!value) return;
  try {
    localStorage.setItem(NICKNAME_KEY, value);
  } catch {
    /* storage unavailable */
  }
}
