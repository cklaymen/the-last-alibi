import type { GameEvent } from "@mystery-game/contracts";
import type { CardId } from "@mystery-game/game";
import { describe, expect, it } from "vitest";
import { deduce, type DeductionInput, factsOnly } from "./deduction.js";

const players = [
  { id: "me", cardCount: 6 },
  { id: "b", cardCount: 6 },
  { id: "c", cardCount: 6 },
];

const input = (over: Partial<DeductionInput> = {}): DeductionInput => ({
  myId: "me",
  players,
  events: [],
  hand: [],
  seenCards: [],
  roomCards: [],
  ...over,
});

const suggested = (
  playerId: string,
  suspect: "red" | "yellow" | "white" | "green" | "blue" | "purple",
  weapon: "candlestick" | "dagger" | "lead_pipe" | "revolver" | "rope" | "wrench",
  room: "kitchen" | "ballroom" | "hall" | "study" | "library" | "lounge",
): GameEvent => ({ type: "suggested", playerId, suggestion: { suspect, weapon, room } });

describe("deduction engine", () => {
  it("cannot_disprove marks the three cards ✗ for that player", () => {
    const d = deduce(
      input({
        events: [
          suggested("me", "red", "rope", "hall"),
          { type: "cannot_disprove", playerId: "b" },
        ],
      }),
    );
    expect(d.cells.b).toMatchObject({ red: "not", rope: "not", hall: "not" });
    expect(d.cells.c?.red).toBeUndefined();
  });

  it("card shown to me marks ✓ and records shownToMe", () => {
    const d = deduce(input({ seenCards: [{ cardId: "rope", fromPlayerId: "c" }] }));
    expect(d.cells.c?.rope).toBe("has");
    expect(d.shownToMe).toEqual({ rope: "c" });
    expect(d.general.rope).toBe("has");
  });

  it("card shown to someone else marks ? on non-✗ cards of that suggestion", () => {
    const d = deduce(
      input({
        events: [
          suggested("b", "red", "rope", "hall"),
          { type: "card_shown", playerId: "c", toPlayerId: "b" },
        ],
        hand: ["hall"],
      }),
    );
    expect(d.cells.c).toMatchObject({ red: "maybe", rope: "maybe", hall: "not" });
    expect(d.cells.b?.red).toBeUndefined();
  });

  it("my cards are ✗ for every other player", () => {
    const d = deduce(input({ hand: ["red", "kitchen"] }));
    for (const p of ["b", "c"]) {
      expect(d.cells[p]).toMatchObject({ red: "not", kitchen: "not" });
    }
    expect(d.cells.me).toBeUndefined();
    expect(d.general).toMatchObject({ red: "has", kitchen: "has" });
  });

  it("room cards are ✗ for every player and general ✓", () => {
    const d = deduce(input({ roomCards: ["dagger"] }));
    expect(d.cells.b?.dagger).toBe("not");
    expect(d.cells.c?.dagger).toBe("not");
    expect(d.general.dagger).toBe("has");
    expect(d.envelope.has("dagger")).toBe(false);
  });

  it("✓ at one player propagates ✗ to the others", () => {
    const d = deduce(input({ seenCards: [{ cardId: "hall", fromPlayerId: "b" }] }));
    expect(d.cells.c?.hall).toBe("not");
  });

  it("full hand (✓ count = cardCount) makes the rest ✗", () => {
    const small = [
      { id: "me", cardCount: 6 },
      { id: "b", cardCount: 2 },
      { id: "c", cardCount: 6 },
    ];
    const d = deduce(
      input({
        players: small,
        seenCards: [
          { cardId: "red", fromPlayerId: "b" },
          { cardId: "rope", fromPlayerId: "b" },
        ],
      }),
    );
    expect(d.cells.b?.hall).toBe("not");
    expect(d.cells.b?.wrench).toBe("not");
    expect(d.cells.b?.red).toBe("has");
  });

  it("single remaining ? of a suggestion becomes ✓", () => {
    const d = deduce(
      input({
        events: [
          suggested("b", "red", "rope", "hall"),
          { type: "card_shown", playerId: "c", toPlayerId: "b" },
        ],
        hand: ["red"],
        seenCards: [{ cardId: "rope", fromPlayerId: "b" }],
      }),
    );
    // red is mine, rope is at b → c must hold the hall
    expect(d.cells.c?.hall).toBe("has");
    expect(d.cells.c?.rope).toBe("not");
    expect(d.cells.b?.hall).toBe("not");
  });

  it("all others ✗ and not mine → envelope", () => {
    const d = deduce(
      input({
        events: [
          suggested("me", "white", "dagger", "study"),
          { type: "cannot_disprove", playerId: "b" },
          { type: "cannot_disprove", playerId: "c" },
          { type: "no_one_disproved", suggesterId: "me" },
        ],
        hand: ["study"],
      }),
    );
    expect(d.envelope.has("white")).toBe(true);
    expect(d.envelope.has("dagger")).toBe(true);
    expect(d.envelope.has("study")).toBe(false);
    expect(d.general.white).toBeUndefined();
  });

  it("all others ✗ is not envelope while some room cards are still unseen", () => {
    const events: GameEvent[] = [
      suggested("me", "white", "dagger", "study"),
      { type: "cannot_disprove", playerId: "b" },
      { type: "cannot_disprove", playerId: "c" },
      { type: "no_one_disproved", suggesterId: "me" },
    ];
    // 5 + 5 + 5 dealt + 3 in the envelope = 18 → 3 cards lie face-down in rooms.
    const fewer = [
      { id: "me", cardCount: 5 },
      { id: "b", cardCount: 5 },
      { id: "c", cardCount: 5 },
    ];
    const unseen = deduce(input({ players: fewer, events, hand: ["study"], roomCards: ["red"] }));
    expect(unseen.envelope.has("white")).toBe(false);
    expect(unseen.envelope.has("dagger")).toBe(false);

    const allSeen = deduce(
      input({ players: fewer, events, hand: ["study"], roomCards: ["red", "rope", "hall"] }),
    );
    expect(allSeen.envelope.has("white")).toBe(true);
    expect(allSeen.envelope.has("dagger")).toBe(true);
  });

  it("last unexcluded card in a section → envelope", () => {
    const d = deduce(
      input({
        hand: ["red", "yellow"],
        seenCards: [
          { cardId: "white", fromPlayerId: "b" },
          { cardId: "green", fromPlayerId: "c" },
        ],
        roomCards: ["blue"],
      }),
    );
    expect(d.envelope.has("purple")).toBe(true);
    expect(d.cells.b?.purple).toBe("not");
    expect(d.cells.c?.purple).toBe("not");
    expect([...d.envelope]).toEqual(["purple"]);
  });

  it("ignores disprove events without a preceding suggestion", () => {
    const d = deduce(
      input({
        events: [
          { type: "cannot_disprove", playerId: "b" },
          { type: "card_shown", playerId: "c", toPlayerId: "b" },
        ],
      }),
    );
    expect(d.cells.b).toEqual({});
    expect(d.cells.c).toEqual({});
  });

  it("terminates on contradictory input", () => {
    const d = deduce(
      input({
        events: [
          suggested("me", "red", "rope", "hall"),
          { type: "cannot_disprove", playerId: "b" },
          { type: "card_shown", playerId: "b", toPlayerId: "c" },
          suggested("c", "red", "rope", "hall"),
          { type: "card_shown", playerId: "b", toPlayerId: "c" },
        ],
        hand: ["red", "rope"],
        seenCards: [
          { cardId: "red", fromPlayerId: "b" },
          { cardId: "hall", fromPlayerId: "c" },
        ],
        roomCards: ["hall"],
      }),
    );
    expect(d.cells.b).toBeDefined();
    expect(d.shownToMe).toEqual({ red: "b", hall: "c" });
  });

  it("is deterministic and ignores players not in the list", () => {
    const events: GameEvent[] = [
      suggested("me", "red", "rope", "hall"),
      { type: "cannot_disprove", playerId: "ghost" },
    ];
    const d = deduce(input({ events }));
    expect(d.cells.ghost).toBeUndefined();
    expect(deduce(input({ events }))).toEqual(d);
  });

  it("factsOnly returns only shownToMe ✓ cells", () => {
    const hand: CardId[] = ["red"];
    const d = factsOnly(
      input({
        events: [
          suggested("me", "white", "rope", "hall"),
          { type: "cannot_disprove", playerId: "b" },
        ],
        hand,
        seenCards: [{ cardId: "rope", fromPlayerId: "c" }],
      }),
    );
    expect(d.cells).toEqual({ b: {}, c: { rope: "has" } });
    expect(d.shownToMe).toEqual({ rope: "c" });
    expect(d.general).toEqual({});
    expect(d.envelope.size).toBe(0);
  });
});
