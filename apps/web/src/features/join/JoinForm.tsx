import { useState } from "react";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { TextField } from "../../shared/ui/TextField.js";
import { loadNickname } from "../nickname/index.js";
import { joinMessages } from "./i18n.js";
import { RoomCodeRow } from "./RoomCodeRow.js";

type Props = {
  isLoading: boolean;
  errorCode: string | null;
  onCreate: (playerName: string) => void;
  onJoin: (playerName: string, roomCode: string) => void;
};

export function JoinForm({ isLoading, errorCode, onCreate, onJoin }: Props) {
  const t = useT(joinMessages);
  const errorText = useErrorText();
  const [playerName, setPlayerName] = useState(loadNickname);
  const [isJoining, setIsJoining] = useState(false);
  const name = playerName.trim();
  const hasName = name.length >= 2;

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
      {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
      <Button disabled={!hasName || isLoading} onClick={() => onCreate(name)}>
        {t("create_room")}
      </Button>
      {isJoining ? (
        <RoomCodeRow
          canJoin={hasName && !isLoading}
          onJoin={(code) => onJoin(name, code)}
        />
      ) : (
        <Button onClick={() => setIsJoining(true)}>{t("join_room")}</Button>
      )}
    </>
  );
}
