import type { CardId } from "@mystery-game/game";

/** Pure notebook model: marks per card plus the cards already auto-marked once. */
export type Mark = "empty" | "has" | "not" | "maybe";
export const marks: readonly Mark[] = ["empty", "has", "not", "maybe"];
export const markSymbol: Record<Mark, string> = { empty: "", has: "✓", not: "✗", maybe: "?" };

export interface NotebookState {
  marks: Partial<Record<CardId, Mark>>;
  /** Cards auto-marked from hand / seen cards; never re-marked after the player changes them. */
  auto: CardId[];
}

export const emptyNotebook: NotebookState = { marks: {}, auto: [] };

export function markOf(state: NotebookState, card: CardId): Mark {
  return state.marks[card] ?? "empty";
}

export function nextMark(mark: Mark): Mark {
  return marks[(marks.indexOf(mark) + 1) % marks.length]!;
}

/** empty → has → not → maybe → empty */
export function cycle(state: NotebookState, card: CardId): NotebookState {
  return { ...state, marks: { ...state.marks, [card]: nextMark(markOf(state, card)) } };
}

/** Marks each new known card "has" if it is still empty; each card is handled once. */
export function autoMark(state: NotebookState, cards: readonly CardId[]): NotebookState {
  const fresh = cards.filter((card) => !state.auto.includes(card));
  if (fresh.length === 0) return state;
  const next = { ...state.marks };
  for (const card of fresh) if ((next[card] ?? "empty") === "empty") next[card] = "has";
  return { marks: next, auto: [...state.auto, ...new Set(fresh)] };
}

export const notebookKey = (gameId: string, playerId: string) =>
  `notebook:${gameId}:${playerId}`;

function isNotebook(value: unknown): value is NotebookState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.marks === "object" && v.marks !== null && Array.isArray(v.auto);
}

/** Parses a stored notebook; anything corrupt becomes the empty notebook. */
export function parseNotebook(raw: string | null): NotebookState {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isNotebook(parsed) ? parsed : emptyNotebook;
  } catch {
    return emptyNotebook;
  }
}

export function loadNotebook(key: string): NotebookState {
  try {
    return parseNotebook(localStorage.getItem(key));
  } catch {
    return emptyNotebook;
  }
}

export function saveNotebook(key: string, state: NotebookState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
