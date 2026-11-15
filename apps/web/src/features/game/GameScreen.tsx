import { useState } from "react";
import { NotebookPen, UserX } from "lucide-react";
import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { Board } from "../board/index.js";
import { CardTile } from "../cards/index.js";
import { DisprovePanel, SeenCards } from "../disprove/index.js";
import { EventLog } from "../event-log/index.js";
import { CardHand } from "../hand/index.js";
import { Notebook } from "../notebook/index.js";
import { PlayersBar, myPlayer } from "../players/index.js";
import { CommandError, TurnPanel, useCommand, type Send } from "../turn/index.js";
import { useT } from "../../shared/i18n/index.js";
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

export function GameLayout({ game, me, myId, send }: LayoutProps) {
  const t = useT(gameScreenMessages);
  const move = useCommand(send);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const eliminated = myPlayer(game, myId)?.eliminated ?? false;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-2 lg:sticky lg:top-3">
        <Board
          game={game}
          me={me}
          myId={myId}
          onMove={(to) => {
            if (!move.busy) void move.run("turn:move", { to });
          }}
        />
        <CommandError message={move.error} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {eliminated && (
          <div className="flex flex-col gap-3 rounded border-2 border-danger bg-surface p-3">
            <p className="m-0 flex items-center gap-2 font-bold text-danger">
              <UserX aria-hidden="true" className="size-5 shrink-0" />
              {t("eliminated")}
            </p>
            {me.envelope && (
              <section aria-label={t("envelope")} className="flex flex-col gap-2">
                <h2 className="m-0 text-sm font-bold text-muted">{t("envelope")}</h2>
                <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
                  {[me.envelope.suspect, me.envelope.weapon, me.envelope.room].map((id) => (
                    <li key={id}>
                      <CardTile id={id} compact />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="order-2 lg:order-1">
          <PlayersBar game={game} myId={myId} />
        </div>
        <div className="order-1 flex flex-col gap-3 lg:order-2">
          <TurnPanel game={game} me={me} myId={myId} send={send} />
          <DisprovePanel game={game} me={me} send={send} />
          <SeenCards game={game} me={me} />
        </div>
        <div className="order-3">
          <CardHand hand={me.hand} />
        </div>
        <div className="order-4 lg:order-5">
          <EventLog game={game} />
        </div>
        <div className="order-5 flex flex-col gap-2 lg:order-4">
          <button
            type="button"
            aria-expanded={notebookOpen}
            onClick={() => setNotebookOpen((o) => !o)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-surface px-4 py-2 font-bold text-fg lg:hidden"
          >
            <NotebookPen aria-hidden="true" className="size-5" />
            {t("notebook")}
          </button>
          <div className={notebookOpen ? "" : "hidden lg:block"}>
            <Notebook />
          </div>
        </div>
      </div>
    </main>
  );
}
