import { defineMessages } from "../../shared/i18n/index.js";

export const turnMessages = defineMessages({
  en: {
    region: "Turn",
    yourTurn: "Your turn",
    othersTurn: "{name}'s turn",
    roll: "Roll dice",
    youRolled: "You rolled {a} + {b} = {sum}",
    othersRolled: "{name} rolled {a} + {b} = {sum}",
    passage: "Secret passage",
    suggest: "Suggest",
    accuse: "Accuse",
    endTurn: "End turn",
    moveHint: "Choose where to move on the board.",
    waiting: "Waiting for {name} to show a card…",
  },
  pl: {
    region: "Tura",
    yourTurn: "Twoja tura",
    othersTurn: "Tura gracza {name}",
    roll: "Rzuć kośćmi",
    youRolled: "Wyrzuciłeś {a} + {b} = {sum}",
    othersRolled: "{name} wyrzuca {a} + {b} = {sum}",
    passage: "Tajne przejście",
    suggest: "Podejrzewaj",
    accuse: "Oskarż",
    endTurn: "Zakończ turę",
    moveHint: "Wybierz na planszy, dokąd chcesz się ruszyć.",
    waiting: "Czekamy, aż {name} pokaże kartę…",
  },
});
