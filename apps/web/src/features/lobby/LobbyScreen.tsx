import { Play } from "lucide-react";
import type { RoomSummary } from "@mystery-game/contracts";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { t } from "../../i18n/index.js";
import { CharacterPicker } from "./CharacterPicker.js";
import { PlayerList } from "./PlayerList.js";
import { RoomStatus } from "./RoomStatus.js";
import { useRoomSocket } from "./useRoomSocket.js";

type Props = {
  room: RoomSummary;
  playerName: string;
  onLeave: () => void;
};

export function LobbyScreen({ room: initialRoom, playerName, onLeave }: Props) {
  const { room, connectionError, startGame, chooseCharacter } = useRoomSocket(
    initialRoom,
    playerName,
  );

  const isLobby = room.phase === "LOBBY";
  const isHost = room.hostName === playerName;
  const canStart =
    isHost &&
    isLobby &&
    room.players.length >= 2 &&
    room.players.every((p) => p.characterId != null);

  return (
    <main className="mx-auto grid min-h-dvh max-w-160 content-start gap-5 bg-white px-5 pt-9 pb-[max(28px,env(safe-area-inset-bottom))]">
      <header>
        <p className="mb-3 text-[.72rem] font-medium uppercase tracking-[.14em] text-accent">
          {t("waiting_room")}
        </p>
        <h1 className="mb-5 text-[clamp(2.2rem,10vw,4rem)] leading-[.93]">
          {t("room_heading")} {room.code}
        </h1>
        <p className="max-w-148 text-[.93rem] leading-relaxed">
          {t("share_code_hint")}
        </p>
      </header>

      <RoomStatus playerCount={room.playerCount} maxPlayers={room.maxPlayers} />

      {isLobby ? (
        <CharacterPicker
          players={room.players}
          playerName={playerName}
          onChoose={chooseCharacter}
        />
      ) : null}

      <PlayerList players={room.players} playerName={playerName} />

      {room.phase === "IN_PROGRESS" ? (
        <p className="m-0 rounded-lg border border-brand bg-brand-soft px-4.5 py-3.5 text-[.85rem] text-brand-dark">
          {t("game_in_progress")}
        </p>
      ) : null}

      {connectionError ? <ErrorMessage message={connectionError} /> : null}

      {isHost && isLobby ? (
        <Button variant="primary" disabled={!canStart} onClick={startGame}>
          <Play aria-hidden="true" /> {t("start_game")}
        </Button>
      ) : null}

      <Button variant="secondary" onClick={onLeave}>
        {t("leave_waiting_room")}
      </Button>
    </main>
  );
}
