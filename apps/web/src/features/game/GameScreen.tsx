import { UserX } from "lucide-react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { Board } from "../board/index.js";
import { EnvelopeCards } from "../cards/index.js";
import { EventLog } from "../event-log/index.js";
import { CardHand } from "../hand/index.js";
import { Notebook } from "../notebook/index.js";
import { PlayersBar, myPlayer } from "../players/index.js";
import { CommandError, useCommand, type Send } from "../turn/index.js";
import { useT } from "../../shared/i18n/index.js";
import { Collapsible } from "../../shared/ui/Collapsible.js";
import { ActionSection } from "./ActionSection.js";
import { useGame } from "./GameContext.js";
import { gameScreenMessages } from "./i18n.js";

/** In-progress game: board + side panel (desktop) / stacked sections (mobile). */
export function GameScreen() {
  const { game, me, myId, send } = useGame();
  const t = useT(gameScreenMessages);
  if (!game || !me)
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <p className="m-0 text-muted">{t("loading")}</p>
      </main>
    );
  return <GameLayout game={game} me={me} myId={myId} send={send} />;
}

type LayoutProps = { game: PublicGameState; me: PrivateGameState; myId: string; send: Send };

/**
 * Board column | right column: Actions → Event log → hand + Notebook → Players.
 * Below `lg` the right column is `display: contents`, so the sticky action section is a
 * direct child of <main> and sticks to the top or bottom of the viewport.
 */
export function GameLayout({ game, me, myId, send }: LayoutProps) {
  const t = useT(gameScreenMessages);
  const move = useCommand(send);
  const eliminated = myPlayer(game, myId)?.eliminated ?? false;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-2 lg:sticky lg:top-3">
        <Board
          game={game}
          me={me}
          myId={myId}
          toolbarStart={<PlayersBar game={game} myId={myId} />}
          onMove={(to) => {
            if (!move.busy) void move.run("turn:move", { to });
          }}
        />
        <CommandError message={move.error} />
      </div>

      <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
        {eliminated && (
          <div className="flex flex-col gap-3 rounded border-2 border-danger bg-surface p-3">
            <p className="m-0 flex items-center gap-2 font-bold text-danger">
              <UserX aria-hidden="true" className="size-5 shrink-0" />
              {t("eliminated")}
            </p>
            {me.envelope && <EnvelopeCards envelope={me.envelope} compact />}
          </div>
        )}

        <ActionSection game={game} me={me} myId={myId} send={send} />

        <Collapsible id="log" title={t("log")}>
          <EventLog game={game} />
        </Collapsible>

        <Collapsible id="notebook" title={t("notebook")}>
          <div className="flex flex-col gap-4">
            <CardHand hand={me.hand} />
            <Notebook />
          </div>
        </Collapsible>
      </div>
    </main>
  );
}
