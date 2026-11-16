import { defineMessages } from "../../shared/i18n/index.js";

export const disproveMessages = defineMessages({
  en: {
    region: "Show a card",
    prompt: "Show one card to {name}",
    hint: "{name} suggests {suspect} with the {weapon} in the {room}. Only {name} will see the card.",
    resultRegion: "Suggestion result",
    nobodyDisprovedYou: "Nobody could disprove",
    nobodyDisproved: "Nobody could disprove {name}'s suggestion",
    showedYouCard: "{name} showed you a card:",
    showedCardTo: "{by} showed a card to {name}",
  },
  pl: {
    region: "Pokaż kartę",
    prompt: "Pokaż jedną kartę graczowi {name}",
    hint: "{name} podejrzewa: {suspect}, narzędzie: {weapon}, miejsce: {room}. Kartę zobaczy tylko {name}.",
    resultRegion: "Wynik sugestii",
    nobodyDisprovedYou: "Nikt nie mógł obalić",
    nobodyDisproved: "Nikt nie mógł obalić sugestii gracza {name}",
    showedYouCard: "{name} pokazał Ci kartę:",
    showedCardTo: "{by} pokazał kartę graczowi {name}",
  },
});
