import type { CardId } from "@mystery-game/game";
import { characterIds, roomIds, weaponIds } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { cardMessages } from "../cards/index.js";
import { useGame } from "../game/index.js";
import { notebookMessages } from "./i18n.js";
import { markOf, notebookKey } from "./notebookModel.js";
import { NotebookCell } from "./NotebookCell.js";
import { useNotebook } from "./useNotebook.js";

const sections = [
  { heading: "suspects", cards: characterIds },
  { heading: "weapons", cards: weaponIds },
  { heading: "rooms", cards: roomIds },
] as const;

/** Detective notebook (region "Notebook"). Renders nothing until the game state arrives. */
export function Notebook() {
  const { game, me, myId } = useGame();
  if (!game) return null;
  const known: CardId[] = [...(me?.hand ?? []), ...(me?.seenCards.map((s) => s.cardId) ?? [])];
  const key = notebookKey(game.gameId, myId);
  return <NotebookGrid key={key} storageKey={key} known={known} />;
}

function NotebookGrid({ storageKey, known }: { storageKey: string; known: CardId[] }) {
  const t = useT(notebookMessages);
  const tc = useT(cardMessages);
  const { state, toggle } = useNotebook(storageKey, known);

  return (
    <section aria-label={t("notebook")} className="flex flex-col gap-3 text-fg">
      <p className="m-0 text-xs text-muted">{t("hint")}</p>
      {sections.map(({ heading, cards }) => (
        <div key={heading}>
          <h3 className="m-0 mb-1 text-sm font-bold text-muted uppercase">{tc(heading)}</h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
            {cards.map((card) => (
              <NotebookCell key={card} card={card} mark={markOf(state, card)} onToggle={toggle} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
