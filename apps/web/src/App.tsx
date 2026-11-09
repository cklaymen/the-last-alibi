import { useState } from "react";
import type { RoomSummary } from "@mystery-game/contracts";
import { JoinScreen } from "./features/join/JoinScreen.js";
import { LobbyScreen } from "./features/lobby/LobbyScreen.js";

type Session = { room: RoomSummary; playerName: string };

export function App() {
  const [session, setSession] = useState<Session | null>(null);

  if (session)
    return (
      <LobbyScreen
        room={session.room}
        playerName={session.playerName}
        onLeave={() => setSession(null)}
      />
    );

  return (
    <JoinScreen
      onJoined={(room, playerName) => setSession({ room, playerName })}
    />
  );
}
