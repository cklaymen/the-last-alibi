import { useEffect, useState } from "react";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { homePath, navigate } from "../../shared/lib/router/index.js";
import { Button } from "../../shared/ui/Button.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { TextField } from "../../shared/ui/TextField.js";
import { loadNickname } from "../nickname/index.js";
import { ApiError, roomsApi, useSession } from "../session/index.js";
import { joinMessages } from "./i18n.js";
import { useJoinRoom } from "./useJoinRoom.js";

/**
 * `/room/<code>` without a session (an invite link): heading "Join room <code>",
 * nickname pre-filled with the remembered one. Checks up front that the room exists.
 */
export function JoinRoomScreen({ code }: { code: string }) {
  const t = useT(joinMessages);
  const errorText = useErrorText();
  const { notice } = useSession();
  const { errorCode, setErrorCode, isLoading, submit } = useJoinRoom();
  const [playerName, setPlayerName] = useState(loadNickname);
  const [missing, setMissing] = useState(false);
  const name = playerName.trim();
  const canJoin = name.length >= 2 && !isLoading && !missing;

  useEffect(() => {
    let active = true;
    roomsApi.check(code).catch((error: unknown) => {
      // Only a definite "no such room" blocks joining; anything else is retried by Join.
      if (active && error instanceof ApiError && error.code === "ROOM_NOT_FOUND") {
        setMissing(true);
        setErrorCode("ROOM_NOT_FOUND");
      }
    });
    return () => {
      active = false;
    };
  }, [code, setErrorCode]);

  const shown = errorCode ?? notice;

  return (
    <ScreenLayout
      header={
        <h1 className="m-0 text-center text-3xl font-bold text-brand-strong">
          {t("join_room_heading", { code })}
        </h1>
      }
    >
      <form
        className="flex flex-col gap-4.25"
        onSubmit={(event) => {
          event.preventDefault();
          if (canJoin) void submit(() => roomsApi.join(name, code));
        }}
      >
        <TextField
          aria-label={t("your_nickname")}
          autoComplete="nickname"
          maxLength={24}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder={t("nickname_placeholder")}
          value={playerName}
        />
        {shown ? <ErrorMessage message={errorText(shown)} /> : null}
        <Button type="submit" disabled={!canJoin}>
          {t("join_room")}
        </Button>
      </form>
      <Button variant="secondary" onClick={() => navigate(homePath)}>
        {t("create_instead")}
      </Button>
    </ScreenLayout>
  );
}
