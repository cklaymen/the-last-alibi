import { useState } from "react";
import { Hand } from "lucide-react";
import type { CardId } from "@mystery-game/game";
import { characterIds, roomIds, weaponIds } from "@mystery-game/game";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { readFlag, writeFlag } from "../../shared/lib/storage.js";
import { Tooltip } from "../../shared/ui/Tooltip.js";
import { CardIcon, cardMessages, characterColorVar } from "../cards/index.js";
import { useGame } from "../game/index.js";
import { notebookMessages } from "./i18n.js";
import { cycleCell, cycleGeneral, effectiveMark, notebookKey } from "./notebookModel.js";
import { updateNotebook, useManualMarks } from "./notebookStore.js";
import { NotebookCell } from "./NotebookCell.js";
import { autoGeneral, useDeduction } from "./useNotebook.js";

const sections = [
  { heading: "suspects", cards: characterIds },
  { heading: "weapons", cards: weaponIds },
  { heading: "rooms", cards: roomIds },
] as const;

export const SHOW_PLAYERS_KEY = "notebook:showPlayers";

/** Detective notebook (region "Notebook"), merged with my cards. Renders nothing until the game state arrives. */
export function Notebook() {
  const { game, me, myId } = useGame();
  if (!game) return null;
  const key = notebookKey(game.gameId, myId);
  return <NotebookTable key={key} storageKey={key} game={game} me={me} myId={myId} />;
}

type TableProps = { storageKey: string; game: PublicGameState; me: PrivateGameState | null; myId: string };

function NotebookTable({ storageKey, game, me, myId }: TableProps) {
  const t = useT(notebookMessages);
  const tc = useT(cardMessages);
  const manual = useManualMarks(storageKey);
  const d = useDeduction(game, me, myId);
  const [showPlayers, setShowPlayers] = useState(() => readFlag(SHOW_PLAYERS_KEY) ?? true);
  const hand: readonly CardId[] = me?.hand ?? [];
  const others = showPlayers
    ? game.turnOrder.flatMap((id) => (id === myId ? [] : game.players.filter((p) => p.id === id)))
    : [];

  const toggleColumns = () => {
    setShowPlayers(!showPlayers);
    writeFlag(SHOW_PLAYERS_KEY, !showPlayers);
  };
  const state = (mark: string) => t(mark as "empty");

  return (
    <section aria-label={t("notebook")} className="flex min-w-0 flex-col gap-3 text-fg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs text-muted">{t("hint")}</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPlayers} onChange={toggleColumns} />
          {t("showPlayers")}
        </label>
      </div>
      {sections.map(({ heading, cards }) => (
        <table key={heading} className="w-full table-fixed border-collapse text-sm">
          <caption className="mb-1 text-left text-sm font-bold text-muted uppercase">{tc(heading)}</caption>
          <colgroup>
            <col />
            <col className="w-10" />
            {others.map((p) => (
              <col key={p.id} className="w-7" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                {t("card")}
              </th>
              <th scope="col" className="text-xs font-normal text-muted">
                {t("general")}
              </th>
              {others.map((p) => (
                <th key={p.id} scope="col" className={`p-0 ${p.eliminated ? "opacity-50" : ""}`}>
                  <Tooltip
                    label={p.name}
                    content={p.name}
                    align="end"
                    className="mx-auto flex size-6 items-center justify-center rounded-full border-[3px] bg-surface text-xs font-bold text-fg"
                    style={{ borderColor: characterColorVar[p.characterId] }}
                    data-eliminated={p.eliminated || undefined}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => {
              const mine = hand.includes(card);
              const envelope = d.envelope.has(card);
              const name = tc(card);
              const general = effectiveMark(manual.general[card], autoGeneral(d, hand, card));
              return (
                <tr
                  key={card}
                  data-in-hand={mine || undefined}
                  data-envelope={envelope || undefined}
                  className={`border-t border-line ${
                    mine ? "bg-surface-2 shadow-[inset_3px_0_0_var(--brand-strong)]" : envelope ? "bg-attention" : ""
                  }`}
                >
                  <th scope="row" className="py-0 pr-1 pl-1.5 text-left font-normal">
                    <span className="@container flex min-w-0 items-center gap-1.5">
                      <CardIcon id={card} size={16} />
                      <span className={`truncate ${general.mark === "not" && !mine ? "text-muted line-through" : ""}`}>
                        {name}
                      </span>
                      {mine && (
                        <Tooltip
                          label={t("inYourHand")}
                          content={t("inYourHand")}
                          align="start"
                          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded bg-surface-2 px-1 py-0.5 text-xs font-bold text-brand-strong"
                        >
                          <Hand aria-hidden="true" className="size-3.5" />
                          <span aria-hidden="true" className="hidden @[11rem]:inline">
                            {t("inHandShort")}
                          </span>
                        </Tooltip>
                      )}
                      {envelope && <span className="sr-only">({t("inEnvelope")})</span>}
                    </span>
                  </th>
                  <td className="p-0">
                    {mine ? (
                      <NotebookCell
                        label={t("cell", { card: name, player: t("general"), state: state("has"), source: t("inHand") })}
                        mark="has"
                        source="manual"
                      />
                    ) : (
                      <NotebookCell
                        label={t("cell", { card: name, player: t("general"), state: state(general.mark), source: t(general.source) })}
                        mark={general.mark}
                        source={general.source}
                        onToggle={() => updateNotebook(storageKey, (s) => cycleGeneral(s, card))}
                      />
                    )}
                  </td>
                  {others.map((p) => {
                    if (mine)
                      return (
                        <td key={p.id} className="p-0">
                          <NotebookCell
                            label={t("cell", { card: name, player: p.name, state: state("not"), source: t("inHand") })}
                            mark="not"
                            source="auto"
                          />
                        </td>
                      );
                    const cell = effectiveMark(manual.cells[p.id]?.[card], d.cells[p.id]?.[card]);
                    const shown = cell.mark === "has" && d.shownToMe[card] === p.id;
                    const label = t("cell", { card: name, player: p.name, state: state(cell.mark), source: t(cell.source) });
                    return (
                      <td key={p.id} className="p-0">
                        <NotebookCell
                          label={shown ? `${label} – ${t("shownToYou")}` : label}
                          mark={cell.mark}
                          source={cell.source}
                          shown={shown}
                          onToggle={() => updateNotebook(storageKey, (s) => cycleCell(s, p.id, card))}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </section>
  );
}
