import { defineMessages } from "../../shared/i18n/index.js";

export const disproveMessages = defineMessages({
  en: {
    region: "Show a card",
    prompt: "Show one card to {name}",
    hint: "{name} suggests {suspect} with the {weapon} in the {room}. Only {name} will see the card.",
    seenRegion: "Cards shown to you",
    seenItem: "{card} (from {name})",
    showedYou: "{name} showed you: {card}",
  },
  pl: {
    region: "Pokaż kartę",
    prompt: "Pokaż jedną kartę graczowi {name}",
    hint: "{name} podejrzewa: {suspect}, narzędzie: {weapon}, miejsce: {room}. Kartę zobaczy tylko {name}.",
    seenRegion: "Karty pokazane tobie",
    seenItem: "{card} (od: {name})",
    showedYou: "{name} pokazuje ci: {card}",
  },
});
