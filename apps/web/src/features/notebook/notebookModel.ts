import type { CardId } from "@mystery-game/game";

/** Pure notebook model: only manual marks are stored; automatic ones are derived (deduction.ts). */
export type Mark = "empty" | "has" | "not" | "maybe";
export type ManualMark = Exclude<Mark, "empty">;
export const markSymbol: Record<Mark, string> = { empty: "", has: "✓", not: "✗", maybe: "?" };

export interface ManualMarks {
  general: Partial<Record<CardId, ManualMark>>;
  /** Per other player id. */
  cells: Record<string, Partial<Record<CardId, ManualMark>>>;
}

export const emptyManual: ManualMarks = { general: {}, cells: {} };

/** v2 key: older (v1) notebooks are deliberately ignored. */
export const notebookKey = (gameId: string, playerId: string) => `notebook:v2:${gameId}:${playerId}`;

const order: readonly (ManualMark | undefined)[] = [undefined, "has", "not", "maybe"];

/** auto → has → not → maybe → auto */
export function cycleManual(m: ManualMark | undefined): ManualMark | undefined {
  return order[(order.indexOf(m) + 1) % order.length];
}

/** A manual mark always wins over the automatic one. */
export function effectiveMark(
  manual?: Mark,
  auto?: Mark,
): { mark: Mark; source: "manual" | "auto" } {
  if (manual && manual !== "empty") return { mark: manual, source: "manual" };
  return { mark: auto ?? "empty", source: "auto" };
}

function withMark<T extends Partial<Record<CardId, ManualMark>>>(rec: T, card: CardId, m: ManualMark | undefined): T {
  const next = { ...rec };
  if (m) next[card] = m;
  else delete next[card];
  return next;
}

/** Cycles the manual general mark of `card`. */
export function cycleGeneral(s: ManualMarks, card: CardId): ManualMarks {
  return { ...s, general: withMark(s.general, card, cycleManual(s.general[card])) };
}

/** Cycles the manual mark of `card` in `playerId`'s column. */
export function cycleCell(s: ManualMarks, playerId: string, card: CardId): ManualMarks {
  const col = s.cells[playerId] ?? {};
  return { ...s, cells: { ...s.cells, [playerId]: withMark(col, card, cycleManual(col[card])) } };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Parses a stored notebook; anything corrupt becomes the empty notebook. */
export function parseManual(raw: string | null): ManualMarks {
  try {
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(v) || !isRecord(v.general) || !isRecord(v.cells)) return emptyManual;
    return v as unknown as ManualMarks;
  } catch {
    return emptyManual;
  }
}
