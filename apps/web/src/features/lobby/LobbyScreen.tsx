import type { RoomSummary } from "@mystery-game/contracts";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { Logo } from "../../shared/ui/Logo.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { t } from "../../i18n/index.js";
import { CharacterPicker } from "./CharacterPicker.js";
import { PlayerList } from "./PlayerList.js";
import { useRoomSocket } from "./useRoomSocket.js";

type Props = { room: RoomSummary; playerName: string };

export function LobbyScreen({ room: initialRoom, playerName }: Props) {
  const { room, connectionError, startGame, chooseCharacter } = useRoomSocket(
    initialRoom,
    playerName,
  );

  const isLobby = room.phase === "LOBBY";
  const isHost = room.hostName === playerName;
  const hasCharacter = room.players.some(
    (p) => p.name === playerName && p.characterId != null,
  );
  const canStart =
    isHost &&
    isLobby &&
    room.players.length >= 2 &&
    room.players.every((p) => p.characterId != null);

  const actionLabel = !hasCharacter
    ? t("choose_character")
    : isHost
      ? t("enter")
      : t("waiting_for_host");

  return (
    <ScreenLayout
      header={
        <>
          <Logo />
          <p className="m-0 text-center text-[28px] text-brand">
            {t("room_label")}: {room.code}
          </p>
          {!isLobby ? (
            <p className="m-0 mt-2 text-center text-brand">
              {t("game_in_progress")}
            </p>
          ) : null}
        </>
      }
    >
      {isLobby ? (
        <>
          <PlayerList players={room.players} playerName={playerName} />
          <CharacterPicker
            players={room.players}
            playerName={playerName}
            onChoose={chooseCharacter}
          />
          {connectionError ? <ErrorMessage message={connectionError} /> : null}
          <Button disabled={!canStart} onClick={startGame}>
            {actionLabel}
          </Button>
        </>
      ) : null}
    </ScreenLayout>
  );
}
