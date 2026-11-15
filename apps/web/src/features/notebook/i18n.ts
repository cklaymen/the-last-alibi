import { defineMessages } from "../../shared/i18n/index.js";

export const notebookMessages = defineMessages({
  en: {
    notebook: "Notebook",
    cell: "{card}: {state}",
    empty: "empty",
    has: "has",
    not: "not",
    maybe: "maybe",
    hint: "Tap a card to cycle: ✓ has · ✗ not · ? maybe",
  },
  pl: {
    notebook: "Notatnik",
    cell: "{card}: {state}",
    empty: "puste",
    has: "ma",
    not: "nie",
    maybe: "może",
    hint: "Dotknij karty, aby zmienić: ✓ ma · ✗ nie · ? może",
  },
});
