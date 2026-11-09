import { useState } from "react";
import arrow from "../../shared/assets/arrow.svg";
import { Button } from "../../shared/ui/Button.js";
import { TextField } from "../../shared/ui/TextField.js";
import { t } from "../../i18n/index.js";

type Props = { canJoin: boolean; onJoin: (roomCode: string) => void };

/** Input and submit button form one control: shared border, square inner edge. */
export function RoomCodeRow({ canJoin, onJoin }: Props) {
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="flex overflow-hidden rounded border border-line transition-colors focus-within:border-brand has-[input:not(:placeholder-shown)]:border-brand">
      <TextField
        bare
        aria-label={t("room_code")}
        autoFocus
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
        disabled={!canJoin || roomCode.length < 4}
        onClick={() => onJoin(roomCode)}
      >
        <img src={arrow} alt="" className="size-6" />
      </Button>
    </div>
  );
}
