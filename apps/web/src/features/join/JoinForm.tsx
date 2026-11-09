import { DoorOpen, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { t } from "../../i18n/index.js";

const labelClass = "mb-2 block text-[.78rem] font-medium uppercase";
const inputClass =
  "min-h-12 w-full rounded-lg border border-field bg-white px-3 py-2.5 text-ink";

type Props = {
  isLoading: boolean;
  error: string | null;
  onCreate: (playerName: string) => void;
  onJoin: (playerName: string, roomCode: string) => void;
};

export function JoinForm({ isLoading, error, onCreate, onJoin }: Props) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const hasName = playerName.trim().length >= 2;

  return (
    <section
      className="max-w-125 rounded-lg border border-line bg-white p-6"
      aria-label={t("join_game_label")}
    >
      <label className={labelClass} htmlFor="player-name">
        {t("your_nickname")}
      </label>
      <input
        id="player-name"
        className={inputClass}
        autoComplete="nickname"
        maxLength={24}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder={t("nickname_placeholder")}
        value={playerName}
      />
      <Button
        variant="primary"
        disabled={!hasName || isLoading}
        onClick={() => onCreate(playerName)}
      >
        <Plus aria-hidden="true" /> {t("create_room")}
      </Button>
      <div className="my-6 flex items-center gap-2.5 text-xs uppercase text-muted before:h-px before:flex-1 before:bg-[#bec5b6] after:h-px after:flex-1 after:bg-[#bec5b6]">
        <span>{t("or")}</span>
      </div>
      <label className={labelClass} htmlFor="room-code">
        {t("room_code")}
      </label>
      <div className="grid grid-cols-[1fr_52px] gap-2">
        <input
          id="room-code"
          className={inputClass}
          inputMode="numeric"
          maxLength={6}
          onChange={(event) =>
            setRoomCode(event.target.value.replace(/\D/g, ""))
          }
          placeholder={t("room_code_placeholder")}
          value={roomCode}
        />
        <Button
          variant="icon"
          aria-label={t("join_room")}
          disabled={!hasName || roomCode.length < 4 || isLoading}
          onClick={() => onJoin(playerName, roomCode)}
        >
          <DoorOpen aria-hidden="true" />
        </Button>
      </div>
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
