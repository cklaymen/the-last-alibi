import type { CardId, CardKind } from "@mystery-game/game";
import { CardTile, cardKind, cardMessages } from "../cards/index.js";
import { useT } from "../../shared/i18n/index.js";
import { handMessages } from "./i18n.js";

const GROUPS: readonly { kind: CardKind; title: "suspects" | "weapons" | "rooms" }[] = [
  { kind: "suspect", title: "suspects" },
  { kind: "weapon", title: "weapons" },
  { kind: "room", title: "rooms" },
];

/** Groups cards by kind, keeping the original order inside each group. */
export function groupHand(hand: readonly CardId[]): { kind: CardKind; cards: CardId[] }[] {
  return GROUPS.map(({ kind }) => ({ kind, cards: hand.filter((c) => cardKind(c) === kind) })).filter(
    (g) => g.cards.length > 0,
  );
}

export function CardHand({ hand }: { hand: readonly CardId[] }) {
  const t = useT(handMessages);
  const card = useT(cardMessages);
  const groups = groupHand(hand);
  return (
    <section aria-label={t("region")} className="flex flex-col gap-2">
      <h2 className="m-0 text-base font-bold">{t("region")}</h2>
      {groups.length === 0 && <p className="m-0 text-sm text-muted">{t("empty")}</p>}
      {groups.map((g) => {
        const title = GROUPS.find((x) => x.kind === g.kind)?.title ?? "suspects";
        return (
          <div key={g.kind} className="flex flex-col gap-1">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-muted">{card(title)}</h3>
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-2">
              {g.cards.map((id) => (
                <li key={id}>
                  <CardTile id={id} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
