import type { ReactNode } from "react";
import { GameProvider, GameScreen, useGame } from "../features/game/index.js";
import { JoinRoomScreen, JoinScreen } from "../features/join/index.js";
import { LobbyScreen } from "../features/lobby/index.js";
import { NicknameButton } from "../features/nickname/index.js";
import { useSession } from "../features/session/index.js";
import { useRoute } from "../shared/lib/router/index.js";
import { AppHeader } from "./AppHeader.js";
import { Loading } from "./Loading.js";

function Frame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      {header}
      {children}
    </div>
  );
}

/**
 * Picks the screen from the URL and the session:
 * `/` → Join; `/room/<code>` with its session → room (by phase), without → join-by-link.
 * In a room the header lives inside GameProvider so it can show my nickname.
 */
export function Screens() {
  const route = useRoute();
  const { status, session } = useSession();

  if (status === "restoring") return <Frame header={<AppHeader />}><Loading /></Frame>;

  if (route.name === "room" && session?.roomCode === route.code) {
    return (
      <GameProvider>
        <Frame header={<AppHeader roomSlot={<NicknameButton />} />}>
          <RoomScreens />
        </Frame>
      </GameProvider>
    );
  }

  return (
    <Frame header={<AppHeader />}>
      {route.name === "room" ? (
        session ? <Loading /> : <JoinRoomScreen key={route.code} code={route.code} />
      ) : (
        <JoinScreen />
      )}
    </Frame>
  );
}

function RoomScreens() {
  const { room, game } = useGame();
  switch (room.phase) {
    case "LOBBY":
      return <LobbyScreen />;
    case "IN_PROGRESS":
      return game ? <GameScreen /> : <Loading />;
    case "FINISHED":
      // Transient: the server returns the room to LOBBY right after a game ends.
      return <Loading />;
  }
}
