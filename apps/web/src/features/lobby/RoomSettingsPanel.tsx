import { useState } from "react";
import type { UpdateSettingsRequest } from "@mystery-game/contracts";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { useGame } from "../game/index.js";
import { RoomSettingsView } from "../room-settings/index.js";
import { lobbyMessages } from "./i18n.js";

/** House rules of the room. The host edits them (one-field patches); others see them read-only. */
export function RoomSettingsPanel() {
  const t = useT(lobbyMessages);
  const errorText = useErrorText();
  const { room, myId, send } = useGame();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function change(patch: UpdateSettingsRequest) {
    setErrorCode(null);
    const result = await send("room:settings", patch);
    if (!result.ok) setErrorCode(result.code);
  }

  return (
    <section aria-label={t("settings")}>
      <h2 className="m-0 mb-2 text-lg font-normal">{t("settings")}</h2>
      <RoomSettingsView
        settings={room.settings}
        onChange={room.hostId === myId ? (patch) => void change(patch) : undefined}
      />
      {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
    </section>
  );
}
