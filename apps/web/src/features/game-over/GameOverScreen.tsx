import { useState } from "react";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { useGame } from "../game/index.js";
import { EnvelopeCards } from "./EnvelopeCards.js";
import { gameOverMessages } from "./i18n.js";

/** Shown when room.phase === "FINISHED": winner, envelope, play again / back to menu. */
export function GameOverScreen() {
  const t = useT(gameOverMessages);
  const errorText = useErrorText();
  const { room, myId, game, send, leave } = useGame();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const winner = game?.winner ?? null;
  const winnerName =
    game?.players.find((p) => p.id === winner?.playerId)?.name ?? "";
  const isHost = room.hostId === myId;

  async function playAgain() {
    setErrorCode(null);
    setBusy(true);
    const result = await send("room:restart", {});
    setBusy(false);
    if (!result.ok) setErrorCode(result.code);
  }

  return (
    <ScreenLayout
      header={
        winner ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="m-0 text-4xl font-bold text-brand-strong">
              {winner.playerId === myId ? t("you_win") : t("other_wins", { name: winnerName })}
            </h1>
            {winner.reason === "LAST_STANDING" ? (
              <p className="m-0 text-lg text-muted">{t("last_standing")}</p>
            ) : null}
          </div>
        ) : null
      }
    >
      {game?.envelope ? <EnvelopeCards envelope={game.envelope} /> : null}
      {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
      {isHost ? (
        <Button disabled={busy} onClick={() => void playAgain()}>
          {t("play_again")}
        </Button>
      ) : (
        <p className="m-0 text-center text-muted">{t("waiting_for_host")}</p>
      )}
      <Button variant="secondary" onClick={leave}>
        {t("back_to_menu")}
      </Button>
    </ScreenLayout>
  );
}
