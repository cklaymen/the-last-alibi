import { defineMessages } from "../../shared/i18n/index.js";

export const roomSettingsMessages = defineMessages({
  en: {
    about: "About: {setting}",
    accusation_place: "Accusation location",
    place_any_room: "Any room",
    place_named_room: "The named room",
    accuse_after_suggestion: "Accuse after suggestion in the same turn",
    suggest_after_staying: "Suggest after staying in a room",
    turn_time_limit: "Turn time limit",
    disprove_time_limit: "Time to show a card",
    limit_none: "None",
    seconds: "{n} s",
    room_cards: "Face-down cards in rooms",
    auto_notes: "Automatic notes",
    info_accusation_place:
      "An accusation is always made from a room. \"Any room\": you may stand in any room and name any room. \"The named room\": you must name the room you are standing in.",
    info_accuse_after_suggestion:
      "On: after your suggestion is answered you may still accuse in the same turn. Off: you have to wait until your next turn.",
    info_suggest_after_staying:
      "On: if you start your turn in a room, you may suggest there without moving (before rolling). Off: you must enter a room this turn or be moved there by another player's suggestion.",
    info_turn_time_limit: "How long one turn may last. When the time runs out the turn ends automatically. The timer pauses while a card is being shown.",
    info_disprove_time_limit: "How long a player has to choose a card to show. When the time runs out one of their matching cards is shown at random.",
    info_room_cards:
      "Cards placed face down in random rooms instead of being dealt. Anyone who has stood in the room may look at its card; they are never used to disprove.",
    info_auto_notes:
      "On: the Cards table fills in conclusions that follow from the game (e.g. who cannot have a card). Off: only cards shown to you are filled in. Your own marks always win.",
  },
  pl: {
    about: "Więcej: {setting}",
    accusation_place: "Miejsce oskarżenia",
    place_any_room: "Dowolny pokój",
    place_named_room: "Pokój z oskarżenia",
    accuse_after_suggestion: "Oskarżenie po sugestii w tej samej turze",
    suggest_after_staying: "Sugestia po pozostaniu w pokoju",
    turn_time_limit: "Limit czasu tury",
    disprove_time_limit: "Czas na pokazanie karty",
    limit_none: "Brak",
    seconds: "{n} s",
    room_cards: "Zakryte karty w pokojach",
    auto_notes: "Automatyczne notatki",
    info_accusation_place:
      "Oskarżenie zawsze składa się z pokoju. „Dowolny pokój”: możesz stać w dowolnym pokoju i wskazać dowolny pokój. „Pokój z oskarżenia”: musisz wskazać pokój, w którym stoisz.",
    info_accuse_after_suggestion:
      "Włączone: po rozstrzygnięciu podejrzenia możesz jeszcze oskarżyć w tej samej turze. Wyłączone: musisz poczekać do następnej tury.",
    info_suggest_after_staying:
      "Włączone: jeśli zaczynasz turę w pokoju, możesz w nim rzucić podejrzenie bez ruchu (przed rzutem). Wyłączone: musisz wejść do pokoju w tej turze albo zostać do niego przeniesiony podejrzeniem innego gracza.",
    info_turn_time_limit: "Ile może trwać jedna tura. Po upływie czasu tura kończy się sama. Zegar stoi, gdy ktoś wybiera kartę do pokazania.",
    info_disprove_time_limit: "Ile czasu gracz ma na wybór karty do pokazania. Po upływie czasu pokazywana jest losowa z jego pasujących kart.",
    info_room_cards:
      "Karty kładzione zakryte w losowych pokojach zamiast rozdania. Każdy, kto stał w pokoju, może obejrzeć jego kartę; nie służą do obalania podejrzeń.",
    info_auto_notes:
      "Włączone: tabela Karty uzupełnia wnioski wynikające z przebiegu gry (np. kto nie może mieć karty). Wyłączone: uzupełniane są tylko karty pokazane tobie. Twoje znaczniki zawsze mają pierwszeństwo.",
  },
});
