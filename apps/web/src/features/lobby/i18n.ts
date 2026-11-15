import { defineMessages } from "../../shared/i18n/index.js";

export const lobbyMessages = defineMessages({
  en: {
    room: "room: {code}",
    players: "Players",
    you: "(you)",
    host: "host",
    select_character: "Select character",
    start_game: "Start game",
    waiting_for_host: "Waiting for host",
    start_hint: "At least 2 players are needed and everyone must choose a character.",
    leave_room: "Leave room",
    reconnecting: "Reconnecting…",
  },
  pl: {
    room: "pokój: {code}",
    players: "Gracze",
    you: "(ty)",
    host: "gospodarz",
    select_character: "Wybierz postać",
    start_game: "Rozpocznij grę",
    waiting_for_host: "Czekamy na gospodarza",
    start_hint: "Potrzeba co najmniej 2 graczy i każdy musi wybrać postać.",
    leave_room: "Opuść pokój",
    reconnecting: "Ponowne łączenie…",
  },
});
