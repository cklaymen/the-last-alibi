import type { GameEvent } from "@mystery-game/contracts";
import type { CardId } from "@mystery-game/game";
import type { eventLogMessages } from "./i18n.js";

export type EventKey = keyof (typeof eventLogMessages)["en"] & string;

export interface Described {
  key: EventKey;
  params: Record<string, string | number>;
}

export interface DescribeContext {
  name: (playerId: string) => string;
  card: (cardId: CardId) => string;
}

/** Maps a public game event to an i18n key and already-resolved parameters. */
export function describeEvent(event: GameEvent, ctx: DescribeContext): Described {
  const { name, card } = ctx;
  switch (event.type) {
    case "game_started":
      return { key: "game_started", params: { name: name(event.firstPlayerId) } };
    case "rolled": {
      const [a, b] = event.dice;
      return { key: "rolled", params: { name: name(event.playerId), a, b, sum: a + b } };
    }
    case "moved":
      return event.to.kind === "room"
        ? { key: "moved_room", params: { name: name(event.playerId), room: card(event.to.roomId) } }
        : { key: "moved_cell", params: { name: name(event.playerId) } };
    case "passage_used":
      return {
        key: "passage_used",
        params: { name: name(event.playerId), from: card(event.from), to: card(event.to) },
      };
    case "suggested":
      return {
        key: "suggested",
        params: {
          name: name(event.playerId),
          suspect: card(event.suggestion.suspect),
          weapon: card(event.suggestion.weapon),
          room: card(event.suggestion.room),
        },
      };
    case "cannot_disprove":
      return { key: "cannot_disprove", params: { name: name(event.playerId) } };
    case "card_shown":
      return {
        key: "card_shown",
        params: { name: name(event.playerId), name2: name(event.toPlayerId) },
      };
    case "no_one_disproved":
      return { key: "no_one_disproved", params: { name: name(event.suggesterId) } };
    case "accused":
      return {
        key: event.correct ? "accused_correct" : "accused_wrong",
        params: {
          name: name(event.playerId),
          suspect: card(event.accusation.suspect),
          weapon: card(event.accusation.weapon),
          room: card(event.accusation.room),
        },
      };
    case "turn_ended":
      return { key: "turn_ended", params: { name: name(event.playerId) } };
    case "game_won":
      return { key: "game_won", params: { name: name(event.playerId) } };
  }
}
