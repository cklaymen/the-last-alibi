import { Footprints } from "lucide-react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { isMyTurn, playerName } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import { turnActions, visibleActions } from "./actions.js";
import { turnMessages } from "./i18n.js";
import type { TurnAction } from "./types.js";
import type { Send } from "./useCommand.js";

type Props = {
  game: PublicGameState;
  me: PrivateGameState;
  myId: string;
  send: Send;
  /** Override for tests / extensions; defaults to the action registry. */
  registry?: readonly TurnAction[];
};

/** Turn indicator, dice result, waiting state and the allowed action buttons. */
export function TurnPanel({ game, me, myId, send, registry = turnActions }: Props) {
  const t = useT(turnMessages);
  const mine = isMyTurn(game, myId);
  const activeName = playerName(game, game.turn.playerId);
  const dice = game.turn.dice;
  const pending = game.turn.pendingSuggestion;
  const actions = visibleActions(me.availableActions, registry);

  return (
    <section aria-label={t("region")} className="flex flex-col gap-3 rounded border border-line bg-surface-2 p-3">
      <p role="status" className="m-0 text-lg font-bold">
        {mine ? t("yourTurn") : t("othersTurn", { name: activeName })}
      </p>
      {dice && (
        <p className="m-0 text-sm" aria-live="polite">
          {mine
            ? t("youRolled", { a: dice[0], b: dice[1], sum: dice[0] + dice[1] })
            : t("othersRolled", { name: activeName, a: dice[0], b: dice[1], sum: dice[0] + dice[1] })}
        </p>
      )}
      {pending && pending.disproverId !== myId && (
        <p className="m-0 text-sm text-muted" aria-live="polite">
          {t("waiting", { name: playerName(game, pending.disproverId) })}
        </p>
      )}
      {me.availableActions.includes("move") && (
        <p className="m-0 flex items-center gap-2 text-sm">
          <Footprints aria-hidden="true" className="size-4 shrink-0 text-brand-strong" />
          {t("moveHint")}
        </p>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map(({ id, Component }) => (
            <Component key={id} game={game} me={me} myId={myId} send={send} />
          ))}
        </div>
      )}
    </section>
  );
}
