import { DoorOpen, Play, Plus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { RoomSummary } from "@mystery-game/contracts";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(action: "create" | "join") {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(
        action === "create" ? `${apiUrl}/rooms` : `${apiUrl}/rooms/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "create"
              ? { playerName }
              : { playerName, roomCode: roomCode.toUpperCase() },
          ),
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(readMessage(payload));
      setRoom(payload as RoomSummary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the server.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (room)
    return (
      <Lobby
        room={room}
        playerName={playerName}
        onLeave={() => setRoom(null)}
      />
    );

  return (
    <main className="welcome-shell">
      <header className="brand">
        <p className="eyebrow">A shared mystery</p>
        <h1>The Last Alibi</h1>
        <p className="lead">
          Gather clues, eliminate suspects, and name the culprit before anyone
          else.
        </p>
      </header>
      <section className="entry-panel" aria-label="Join a game">
        <label htmlFor="player-name">Your nickname</label>
        <input
          id="player-name"
          autoComplete="nickname"
          maxLength={24}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder="e.g. Alex"
          value={playerName}
        />
        <button
          className="primary-action"
          disabled={playerName.trim().length < 2 || isLoading}
          onClick={() => void submit("create")}
          type="button"
        >
          <Plus aria-hidden="true" /> Create room
        </button>
        <div className="join-divider">
          <span>or</span>
        </div>
        <label htmlFor="room-code">Room code</label>
        <div className="join-row">
          <input
            id="room-code"
            maxLength={7}
            onChange={(event) => setRoomCode(event.target.value)}
            placeholder="MYST-42"
            value={roomCode}
          />
          <button
            aria-label="Join room"
            className="icon-action"
            disabled={
              playerName.trim().length < 2 || roomCode.length < 6 || isLoading
            }
            onClick={() => void submit("join")}
            type="button"
          >
            <DoorOpen aria-hidden="true" />
          </button>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function Lobby({
  room,
  playerName,
  onLeave,
}: {
  room: RoomSummary;
  playerName: string;
  onLeave: () => void;
}) {
  const [currentRoom, setCurrentRoom] = useState(room);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isHost = currentRoom.hostName === playerName;
  const canStart =
    isHost && currentRoom.playerCount >= 2 && currentRoom.phase === "LOBBY";

  useEffect(() => {
    const socket = io(apiUrl);
    socketRef.current = socket;
    socket.on("connect", () =>
      socket.emit("room:subscribe", { roomCode: room.code }),
    );
    socket.on("room:state", (nextRoom: RoomSummary) => {
      setCurrentRoom(nextRoom);
      setConnectionError(null);
    });
    socket.on("connect_error", () =>
      setConnectionError("Live updates are unavailable. Reconnecting..."),
    );
    return () => {
      socket.close();
    };
  }, [room.code]);

  function startGame() {
    socketRef.current?.emit("room:start", {
      roomCode: currentRoom.code,
      playerName,
    });
  }

  return (
    <main className="lobby-shell">
      <header className="lobby-header">
        <p className="eyebrow">Waiting room</p>
        <h1>Room {currentRoom.code}</h1>
        <p>
          Share the code with your friends. The host can start with two or more
          players.
        </p>
      </header>
      <section className="room-status" aria-label="Players in this room">
        <Users aria-hidden="true" />
        <div>
          <strong>
            {currentRoom.playerCount} / {currentRoom.maxPlayers}
          </strong>
          <span> players in room</span>
        </div>
      </section>
      <section className="player-card">
        <img alt="Detective portrait" src="/miss_scarlett.jpg" />
        <div>
          <p>You</p>
          <h2>{playerName}</h2>
          <span>
            {currentRoom.phase === "IN_PROGRESS"
              ? "Game started"
              : "Waiting for the host"}
          </span>
        </div>
      </section>
      {connectionError ? (
        <p className="error" role="alert">
          {connectionError}
        </p>
      ) : null}
      {isHost ? (
        <button
          className="primary-action"
          disabled={!canStart}
          onClick={startGame}
          type="button"
        >
          <Play aria-hidden="true" /> Start game
        </button>
      ) : null}
      <button className="secondary-action" onClick={onLeave} type="button">
        Leave waiting room
      </button>
    </main>
  );
}

function readMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  )
    return payload.message;
  return "Unable to complete this action.";
}
