import type { GameEvent } from "@mystery-game/contracts";
import { type CardId, characterIds, roomIds, weaponIds } from "@mystery-game/game";

/**
 * Pure notebook deduction: derives per-player facts from what this player
 * provably knows (event history, own hand, cards shown to them, room cards).
 * Manual notebook marks are never an input – they only override the display.
 */
export type Fact = "has" | "not" | "maybe";

export interface DeductionInput {
  myId: string;
  /** Turn order, includes me. */
  players: readonly { id: string; cardCount: number }[];
  /** Full history, oldest first. */
  events: readonly GameEvent[];
  hand: readonly CardId[];
  seenCards: readonly { cardId: CardId; fromPlayerId: string }[];
  /** Cards known to lie face-down in rooms. */
  roomCards: readonly CardId[];
}

export interface Deduction {
  /** Other players only. */
  cells: Record<string, Partial<Record<CardId, Fact>>>;
  general: Partial<Record<CardId, "has">>;
  /** Rows highlighted as "in envelope". */
  envelope: ReadonlySet<CardId>;
  /** Card → player who showed it to me. */
  shownToMe: Partial<Record<CardId, string>>;
}

const sections: readonly (readonly CardId[])[] = [characterIds, weaponIds, roomIds];
const allCards: readonly CardId[] = sections.flat();

type Known = "has" | "not";
/** "X has at least one of these cards" (X showed one of them to someone else). */
interface Constraint {
  playerId: string;
  cards: readonly CardId[];
}

function shownToMeOf(input: DeductionInput, others: ReadonlySet<string>) {
  const shown: Partial<Record<CardId, string>> = {};
  for (const { cardId, fromPlayerId } of input.seenCards) {
    if (others.has(fromPlayerId)) shown[cardId] = fromPlayerId;
  }
  return shown;
}

function otherIds(input: DeductionInput): string[] {
  return input.players.map((p) => p.id).filter((id) => id !== input.myId);
}

/** autoNotes off: only the facts the player was shown directly. */
export function factsOnly(input: DeductionInput): Deduction {
  const others = otherIds(input);
  const shownToMe = shownToMeOf(input, new Set(others));
  const cells: Deduction["cells"] = Object.fromEntries(others.map((id) => [id, {}]));
  for (const [card, playerId] of Object.entries(shownToMe) as [CardId, string][]) {
    cells[playerId]![card] = "has";
  }
  return { cells, general: {}, envelope: new Set(), shownToMe };
}

class Grid {
  private readonly known = new Map<string, Map<CardId, Known>>();
  changed = false;

  constructor(readonly players: readonly string[]) {
    for (const id of players) this.known.set(id, new Map());
  }

  get(playerId: string, card: CardId): Known | undefined {
    return this.known.get(playerId)?.get(card);
  }

  /** Monotone: a decided cell is never overwritten (first fact wins), so the fixed point terminates. */
  set(playerId: string, card: CardId, value: Known): void {
    const row = this.known.get(playerId);
    if (!row || row.has(card)) return;
    row.set(card, value);
    this.changed = true;
  }

  hasCount(playerId: string): number {
    let n = 0;
    for (const v of this.known.get(playerId)?.values() ?? []) if (v === "has") n++;
    return n;
  }

  heldByAnyone(card: CardId): boolean {
    return this.players.some((id) => this.get(id, card) === "has");
  }
}

function collectFromEvents(events: readonly GameEvent[], grid: Grid, myId: string): Constraint[] {
  const constraints: Constraint[] = [];
  let last: readonly CardId[] | null = null;
  for (const event of events) {
    if (event.type === "suggested") {
      const { suspect, weapon, room } = event.suggestion;
      last = [suspect, weapon, room];
    } else if (event.type === "cannot_disprove" && last) {
      for (const card of last) grid.set(event.playerId, card, "not");
    } else if (event.type === "card_shown" && last && event.toPlayerId !== myId) {
      if (grid.players.includes(event.playerId)) {
        constraints.push({ playerId: event.playerId, cards: last });
      }
    }
  }
  return constraints;
}

export function deduce(input: DeductionInput): Deduction {
  const others = otherIds(input);
  const grid = new Grid(others);
  const shownToMe = shownToMeOf(input, new Set(others));
  const cardCount = new Map(input.players.map((p) => [p.id, p.cardCount]));
  const outside = new Set<CardId>([...input.hand, ...input.roomCards]);
  const envelope = new Set<CardId>();

  for (const [card, playerId] of Object.entries(shownToMe) as [CardId, string][]) {
    grid.set(playerId, card, "has");
  }
  for (const card of outside) for (const id of others) grid.set(id, card, "not");
  const constraints = collectFromEvents(input.events, grid, input.myId);

  const isGeneral = (card: CardId) => outside.has(card) || grid.heldByAnyone(card);
  const bound = allCards.length * Math.max(1, input.players.length);

  for (let i = 0; i < bound; i++) {
    grid.changed = false;
    for (const card of allCards) {
      const holder = others.find((id) => grid.get(id, card) === "has");
      if (holder) for (const id of others) if (id !== holder) grid.set(id, card, "not");
    }
    for (const id of others) {
      if (grid.hasCount(id) < (cardCount.get(id) ?? Infinity)) continue;
      for (const card of allCards) grid.set(id, card, "not");
    }
    for (const { playerId, cards } of constraints) {
      const open = cards.filter((card) => grid.get(playerId, card) !== "not");
      if (open.length === 1) grid.set(playerId, open[0]!, "has");
    }
    for (const section of sections) {
      const candidates = section.filter((card) => !isGeneral(card));
      if (candidates.length === 1) envelope.add(candidates[0]!);
    }
    for (const card of allCards) {
      if (outside.has(card)) continue;
      if (others.every((id) => grid.get(id, card) === "not")) envelope.add(card);
    }
    for (const card of envelope) for (const id of others) grid.set(id, card, "not");
    if (!grid.changed) break;
  }

  const cells: Deduction["cells"] = {};
  for (const id of others) {
    const row: Partial<Record<CardId, Fact>> = {};
    for (const card of allCards) {
      const fact = grid.get(id, card);
      if (fact) row[card] = fact;
    }
    cells[id] = row;
  }
  for (const { playerId, cards } of constraints) {
    const row = cells[playerId]!;
    if (cards.some((card) => row[card] === "has")) continue;
    for (const card of cards) if (!row[card]) row[card] = "maybe";
  }

  const general: Deduction["general"] = {};
  for (const card of allCards) if (isGeneral(card)) general[card] = "has";

  return { cells, general, envelope, shownToMe };
}
