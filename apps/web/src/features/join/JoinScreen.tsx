import type { RoomSummary } from "@mystery-game/contracts";
import { Logo } from "../../shared/ui/Logo.js";
import { ScreenLayout } from "../../shared/ui/ScreenLayout.js";
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
    <ScreenLayout header={<Logo />}>
      <JoinForm
        isLoading={isLoading}
        error={error}
        onCreate={(name) => void run(name, () => createRoom(name))}
        onJoin={(name, code) => void run(name, () => joinRoom(name, code))}
      />
    </ScreenLayout>
  );
}
