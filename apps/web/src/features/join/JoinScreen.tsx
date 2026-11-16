import { useT } from "../../shared/i18n/index.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
import { roomsApi, useSession } from "../session/index.js";
import { joinMessages } from "./i18n.js";
import { JoinForm } from "./JoinForm.js";
import { useJoinRoom } from "./useJoinRoom.js";

export function JoinScreen() {
  const t = useT(joinMessages);
  const { errorCode, isLoading, submit } = useJoinRoom();
  const { notice } = useSession();

  return (
    <ScreenLayout
      header={
        <p className="m-0 text-center text-2xl text-brand-strong">{t("tagline")}</p>
      }
      footer={
        <p className="m-0 text-xs text-muted">{t("version", { version: __APP_VERSION__ })}</p>
      }
    >
      <JoinForm
        isLoading={isLoading}
        errorCode={errorCode ?? notice}
        onCreate={(name) => void submit(() => roomsApi.create(name))}
        onJoin={(name, code) => void submit(() => roomsApi.join(name, code))}
      />
    </ScreenLayout>
  );
}
