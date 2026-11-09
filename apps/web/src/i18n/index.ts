/**
 * Minimal i18n — add a new locale object to `locales` and call setLocale() to switch.
 * Key names intentionally mirror i18next's flat-key convention for easy migration.
 */

const en = {
  your_nickname: "Your nickname",
  nickname_placeholder: "Nickname",
  create_room: "Create room",
  room_code: "Room code",
  room_code_placeholder: "Room code...",
  join_room: "Join room",
  room_label: "room",
  waiting_for_host: "Waiting for host",
  game_in_progress: "Game in progress",
  enter: "Enter",
  choose_character: "Select character",
  character_scarlet: "Miss Scarlett",
  character_mustard: "Col. Mustard",
  character_orchid: "Dr. Orchid",
  character_peacock: "Mrs. Peacock",
  character_plum: "Prof. Plum",
  character_green: "Rev. Green",
  err_connect: "Unable to connect to the server.",
  err_action: "Unable to complete this action.",
  err_live_updates: "Live updates are unavailable. Reconnecting…",
} as const;

type Translations = typeof en;
type Key = keyof Translations;
type Locale = "en";

const locales: Record<Locale, Translations> = { en };
let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function t(key: Key): string {
  return locales[currentLocale][key];
}
