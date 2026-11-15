import { useT } from "../../shared/i18n/index.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { roomsApi } from "../session/index.js";
import { joinMessages } from "./i18n.js";
import { JoinForm } from "./JoinForm.js";
import { useJoinRoom } from "./useJoinRoom.js";

export function JoinScreen() {
  const t = useT(joinMessages);
  const { errorCode, isLoading, submit } = useJoinRoom();

  return (
    <ScreenLayout
      header={
        <p className="m-0 text-center text-2xl text-brand-strong">{t("tagline")}</p>
      }
    >
      <JoinForm
        isLoading={isLoading}
        errorCode={errorCode}
        onCreate={(name) => void submit(() => roomsApi.create(name))}
        onJoin={(name, code) => void submit(() => roomsApi.join(name, code))}
      />
    </ScreenLayout>
  );
}
