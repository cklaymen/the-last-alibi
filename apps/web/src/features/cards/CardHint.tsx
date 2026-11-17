import { Hand } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { cardMessages } from "./i18n.js";

/** Notebook mark of a card (same values as the notebook feature). */
export type CardMark = "empty" | "has" | "not" | "maybe";
export type CardAnnotation = { inHand: boolean; mark: CardMark };

const markSymbol: Record<CardMark, string> = { empty: "", has: "✓", not: "✗", maybe: "?" };
const markTone: Record<CardMark, string> = {
  empty: "",
  has: "text-brand-strong",
  not: "text-danger",
  maybe: "text-fg",
};

/** "In hand" chip (hand icon + text). */
export function InHandChip() {
  const t = useT(cardMessages);
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 font-bold text-brand-strong">
      <Hand aria-hidden="true" className="size-3.5 shrink-0" />
      {t("in_hand")}
    </span>
  );
}

/** Hint under a card: "In hand" chip and/or my notebook mark; nothing when there is nothing to show. */
export function CardHint({ note }: { note: CardAnnotation }) {
  const t = useT(cardMessages);
  const { inHand, mark } = note;
  if (!inHand && mark === "empty") return null;
  const markText = mark === "empty" ? "" : t("notebook_mark", { state: t(`mark_${mark}`) });
  return (
    <span className="flex min-h-5 items-center justify-between gap-1 px-1 text-xs">
      {inHand ? <InHandChip /> : <span />}
      {mark !== "empty" ? (
        <span title={markText} className={`font-bold ${markTone[mark]}`}>
          <span aria-hidden="true">{markSymbol[mark]}</span>
          <span className="sr-only">{markText}</span>
        </span>
      ) : null}
    </span>
  );
}
