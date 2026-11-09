import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { JoinForm } from "./JoinForm.js";
import { createRoom, joinRoom } from "./roomsApi.js";
import { useJoinRoom } from "./useJoinRoom.js";

type Props = { onJoined: (room: RoomSummary, playerName: string) => void };

export function JoinScreen({ onJoined }: Props) {
  const { error, isLoading, submit } = useJoinRoom();

  async function run(
    playerName: string,
    request: () => Promise<RoomSummary>,
  ) {
    const room = await submit(request);
    if (room) onJoined(room, playerName);
  }

  return (
    <main className="grid min-h-dvh content-center gap-9 bg-white px-5 pt-9 pb-[max(28px,env(safe-area-inset-bottom))] md:px-[max(48px,calc((100vw-1080px)/2))]">
      <header className="max-w-125">
        <p className="mb-3 text-[.72rem] font-medium uppercase tracking-[.14em] text-accent">
          {t("welcome_eyebrow")}
        </p>
        <h1 className="mb-5 text-[clamp(2.5rem,12vw,4.7rem)] leading-[.93]">
          {t("welcome_title")}
        </h1>
        <p className="max-w-148 text-[.93rem] leading-relaxed">
          {t("welcome_lead")}
        </p>
      </header>
      <JoinForm
        isLoading={isLoading}
        error={error}
        onCreate={(name) => void run(name, () => createRoom(name))}
        onJoin={(name, code) => void run(name, () => joinRoom(name, code))}
      />
    </main>
  );
}
