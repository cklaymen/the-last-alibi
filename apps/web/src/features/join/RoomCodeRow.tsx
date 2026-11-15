import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { Button } from "../../shared/ui/Button.js";
import { TextField } from "../../shared/ui/TextField.js";
import { joinMessages } from "./i18n.js";

type Props = { canJoin: boolean; onJoin: (roomCode: string) => void };

/** Input and submit button form one control: shared border, square inner edge. */
export function RoomCodeRow({ canJoin, onJoin }: Props) {
  const t = useT(joinMessages);
  const [roomCode, setRoomCode] = useState("");
  const canSubmit = canJoin && roomCode.length >= 4;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onJoin(roomCode);
      }}
      className="flex overflow-hidden rounded border border-line transition-colors focus-within:border-brand has-[input:not(:placeholder-shown)]:border-brand"
    >
      <TextField
        bare
        aria-label={t("room_code")}
        autoFocus
        inputMode="numeric"
        maxLength={6}
        onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, ""))}
        placeholder={t("room_code_placeholder")}
        value={roomCode}
      />
      <Button type="submit" variant="icon" aria-label={t("join_room")} disabled={!canSubmit}>
        <ArrowRight aria-hidden="true" className="size-7" />
      </Button>
    </form>
  );
}
