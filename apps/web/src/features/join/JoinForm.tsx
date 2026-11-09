import { useState } from "react";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { TextField } from "../../shared/ui/TextField.js";
import { t } from "../../i18n/index.js";
import { RoomCodeRow } from "./RoomCodeRow.js";

type Props = {
  isLoading: boolean;
  error: string | null;
  onCreate: (playerName: string) => void;
  onJoin: (playerName: string, roomCode: string) => void;
};

export function JoinForm({ isLoading, error, onCreate, onJoin }: Props) {
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const hasName = playerName.trim().length >= 2;

  return (
    <>
      <TextField
        aria-label={t("your_nickname")}
        autoComplete="nickname"
        maxLength={24}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder={t("nickname_placeholder")}
        value={playerName}
      />
      {error ? <ErrorMessage message={error} /> : null}
      <Button
        disabled={!hasName || isLoading}
        onClick={() => onCreate(playerName)}
      >
        {t("create_room")}
      </Button>
      {isJoining ? (
        <RoomCodeRow
          canJoin={hasName && !isLoading}
          onJoin={(code) => onJoin(playerName, code)}
        />
      ) : (
        <Button onClick={() => setIsJoining(true)}>{t("join_room")}</Button>
      )}
    </>
  );
}
