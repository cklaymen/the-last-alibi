/**
 * Minimal i18n — add a new locale object to `locales` and call setLocale() to switch.
 * Key names intentionally mirror i18next's flat-key convention for easy migration.
 */

const en = {
  welcome_eyebrow: "A shared mystery",
  welcome_title: "The Last Alibi",
  welcome_lead:
    "Gather clues, eliminate suspects, and name the culprit before anyone else.",
  your_nickname: "Your nickname",
  nickname_placeholder: "e.g. Alex",
  create_room: "Create room",
  or: "or",
  room_code: "Room code",
  room_code_placeholder: "e.g. 482916",
  join_room: "Join room",
  waiting_room: "Waiting room",
  room_heading: "Room",
  share_code_hint:
    "Share the code with your friends. The host can start once every player has chosen a character.",
  players_in_room: "players in room",
  you_label: "You",
  waiting_for_host: "Waiting for the host",
  game_in_progress: "Game in progress",
  start_game: "Start game",
  leave_waiting_room: "Leave waiting room",
  choose_character: "Choose your character",
  char_taken: "Taken",
  character_scarlet: "Miss Scarlett",
  character_mustard: "Col. Mustard",
  character_orchid: "Dr. Orchid",
  character_peacock: "Mrs. Peacock",
  character_plum: "Prof. Plum",
  character_green: "Rev. Green",
  no_character: "No character",
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
