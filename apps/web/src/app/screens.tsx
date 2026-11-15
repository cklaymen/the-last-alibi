import { GameOverScreen } from "../features/game-over/index.js";
import { GameProvider, GameScreen, useGame } from "../features/game/index.js";
import { JoinScreen } from "../features/join/index.js";
import { LobbyScreen } from "../features/lobby/index.js";
import { useSession } from "../features/session/index.js";
import { Loading } from "./Loading.js";

/** Picks the screen: no session → Join; otherwise by room phase. */
export function Screens() {
  const { status, session } = useSession();
  if (status === "restoring") return <Loading />;
  if (!session) return <JoinScreen />;
  return (
    <GameProvider>
      <RoomScreens />
    </GameProvider>
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
      return game ? <GameOverScreen /> : <Loading />;
  }
}
