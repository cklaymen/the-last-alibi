import { defineMessages } from "../../shared/i18n/index.js";

export const gameOverMessages = defineMessages({
  en: {
    you_win: "You win!",
    other_wins: "{name} wins!",
    last_standing: "Last detective standing.",
    solution: "The solution was:",
    envelope: "Envelope",
    play_again: "Play again",
    waiting_for_host: "Waiting for the host to start a new game…",
    back_to_menu: "Back to menu",
  },
  pl: {
    you_win: "Wygrywasz!",
    other_wins: "{name} wygrywa!",
    last_standing: "Ostatni detektyw w grze.",
    solution: "Rozwiązanie:",
    envelope: "Koperta",
    play_again: "Zagraj ponownie",
    waiting_for_host: "Czekamy, aż gospodarz rozpocznie nową grę…",
    back_to_menu: "Wróć do menu",
  },
});
