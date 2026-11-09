import { describe, expect, it } from "vitest";
import { buildDeck, dealCards } from "../src/cards.js";
import { characterIds, roomIds, weaponIds } from "../src/types.js";
import type { CardId, PlayerId, Rng } from "../src/types.js";

function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length]!;
}

const p1 = "p1" as PlayerId;
const p2 = "p2" as PlayerId;
const p3 = "p3" as PlayerId;

// ── buildDeck ──────────────────────────────────────────────────────────────

describe("buildDeck", () => {
  it("returns exactly 21 cards", () => {
    expect(buildDeck()).toHaveLength(21);
  });

  it("contains all 6 suspects", () => {
    const deck = buildDeck();
    for (const id of characterIds) expect(deck).toContain(id);
  });

  it("contains all 6 weapons", () => {
    const deck = buildDeck();
    for (const id of weaponIds) expect(deck).toContain(id);
  });

  it("contains all 9 rooms", () => {
    const deck = buildDeck();
    for (const id of roomIds) expect(deck).toContain(id);
  });
});

// ── dealCards ──────────────────────────────────────────────────────────────

describe("dealCards", () => {
  it("throws when fewer than 2 players", () => {
    expect(() => dealCards([p1], seqRng([0]))).toThrow();
  });

  it("envelope never appears in any player's hand", () => {
    const rng = seqRng([0.0, 0.0, 0.0, 0.5, 0.1, 0.3, 0.7, 0.9, 0.2]);
    const { envelope, hands } = dealCards([p1, p2, p3], rng);
    const allDealt: CardId[] = [
      ...(hands.get(p1) ?? []),
      ...(hands.get(p2) ?? []),
      ...(hands.get(p3) ?? []),
    ];
    expect(allDealt).not.toContain(envelope.suspect);
    expect(allDealt).not.toContain(envelope.weapon);
    expect(allDealt).not.toContain(envelope.room);
  });

  it("all 21 cards are accounted for (18 dealt + 3 in envelope)", () => {
    const rng = seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    const { envelope, hands } = dealCards([p1, p2], rng);
    const allDealt: CardId[] = [
      ...(hands.get(p1) ?? []),
      ...(hands.get(p2) ?? []),
    ];
    const envelopeCards: CardId[] = [
      envelope.suspect,
      envelope.weapon,
      envelope.room,
    ];
    const all = [...allDealt, ...envelopeCards].sort();
    expect(all).toHaveLength(21);
    // No duplicates
    expect(new Set(all).size).toBe(21);
  });

  it("distributes 18 remaining cards as evenly as possible between 2 players (9 each)", () => {
    const rng = seqRng([0, 0, 0, 0.5, 0.2, 0.7, 0.3, 0.8, 0.1]);
    const { hands } = dealCards([p1, p2], rng);
    expect(hands.get(p1)?.length).toBe(9);
    expect(hands.get(p2)?.length).toBe(9);
  });

  it("with 3 players deals 6 cards to first two and 6 to third (18 = 6+6+6)", () => {
    const rng = seqRng([0, 0, 0, 0.5, 0.2, 0.7, 0.3, 0.8, 0.1]);
    const { hands } = dealCards([p1, p2, p3], rng);
    expect(hands.get(p1)?.length).toBe(6);
    expect(hands.get(p2)?.length).toBe(6);
    expect(hands.get(p3)?.length).toBe(6);
  });

  it("uneven deal: 4 players get 18 cards → 5,5,4,4", () => {
    const p4 = "p4" as PlayerId;
    const rng = seqRng([0, 0, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
    const { hands } = dealCards([p1, p2, p3, p4], rng);
    const sizes = [p1, p2, p3, p4]
      .map((p) => hands.get(p)?.length ?? 0)
      .sort((a, b) => b - a);
    expect(sizes).toEqual([5, 5, 4, 4]);
  });

  it("envelope contains exactly one suspect, one weapon, one room", () => {
    const rng = seqRng([0, 0, 0, 0.5]);
    const { envelope } = dealCards([p1, p2], rng);
    expect(characterIds).toContain(envelope.suspect);
    expect(weaponIds).toContain(envelope.weapon);
    expect(roomIds).toContain(envelope.room);
  });
});
