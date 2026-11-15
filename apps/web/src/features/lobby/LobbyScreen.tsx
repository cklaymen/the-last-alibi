import { useState } from "react";
import type { CommandResult } from "@mystery-game/contracts";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { useGame } from "../game/index.js";
import { CharacterPicker } from "./CharacterPicker.js";
import { lobbyMessages } from "./i18n.js";
import { PlayerList } from "./PlayerList.js";

export function LobbyScreen() {
  const t = useT(lobbyMessages);
  const errorText = useErrorText();
  const { room, myId, connected, send, leave } = useGame();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const isHost = room.hostId === myId;
  const canStart =
    room.players.length >= 2 && room.players.every((p) => p.characterId != null);

  async function run(command: Promise<CommandResult>) {
    setErrorCode(null);
    const result = await command;
    if (!result.ok) setErrorCode(result.code);
  }

  return (
    <ScreenLayout
      header={
        <p className="m-0 text-center text-[28px] text-brand-strong">
          {t("room", { code: room.code })}
        </p>
      }
    >
      <PlayerList room={room} myId={myId} />
      <CharacterPicker
        players={room.players}
        myId={myId}
        onChoose={(characterId) => void run(send("room:choose_character", { characterId }))}
      />
      {!connected ? (
        <p role="status" className="m-0 text-center text-sm text-muted">
          {t("reconnecting")}
        </p>
      ) : null}
      {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
      {isHost ? (
        <>
          {!canStart ? (
            <p className="m-0 text-center text-sm text-muted">{t("start_hint")}</p>
          ) : null}
          <Button disabled={!canStart} onClick={() => void run(send("room:start", {}))}>
            {t("start_game")}
          </Button>
        </>
      ) : (
        <Button disabled>{t("waiting_for_host")}</Button>
      )}
      <Button variant="secondary" onClick={leave}>
        {t("leave_room")}
      </Button>
    </ScreenLayout>
  );
}
