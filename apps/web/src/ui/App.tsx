import { DoorOpen, Plus, Users } from "lucide-react";
import { useState } from "react";
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
      if (!response.ok) {
        throw new Error(readMessage(payload));
      }
      setRoom(payload as RoomSummary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nie udało się połączyć z serwerem.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (room) {
    return (
      <Lobby
        room={room}
        playerName={playerName}
        onLeave={() => setRoom(null)}
      />
    );
  }

  return (
    <main className="welcome-shell">
      <header className="brand">
        <p className="eyebrow">Wspólna tajemnica</p>
        <h1>The Last Alibi</h1>
        <p className="lead">
          Zbierz tropy, wyklucz podejrzanych i wskaż sprawcę przed pozostałymi.
        </p>
      </header>
      <section className="entry-panel" aria-label="Dołącz do rozgrywki">
        <label htmlFor="player-name">Twój pseudonim</label>
        <input
          id="player-name"
          autoComplete="nickname"
          maxLength={24}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder="np. Alex"
          value={playerName}
        />
        <button
          className="primary-action"
          disabled={playerName.trim().length < 2 || isLoading}
          onClick={() => void submit("create")}
          type="button"
        >
          <Plus aria-hidden="true" /> Utwórz pokój
        </button>
        <div className="join-divider">
          <span>albo</span>
        </div>
        <label htmlFor="room-code">Kod pokoju</label>
        <div className="join-row">
          <input
            id="room-code"
            maxLength={7}
            onChange={(event) => setRoomCode(event.target.value)}
            placeholder="MYST-42"
            value={roomCode}
          />
          <button
            aria-label="Dołącz do pokoju"
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
  return (
    <main className="lobby-shell">
      <header className="lobby-header">
        <p className="eyebrow">Poczekalnia</p>
        <h1>Pokój {room.code}</h1>
        <p>Udostępnij kod znajomym. Gospodarz rozpocznie po zebraniu ekipy.</p>
      </header>
      <section className="room-status" aria-label="Uczestnicy pokoju">
        <Users aria-hidden="true" />
        <div>
          <strong>
            {room.playerCount} / {room.maxPlayers}
          </strong>
          <span> graczy w pokoju</span>
        </div>
      </section>
      <section className="player-card">
        <img alt="Portret detektywa" src="/miss_scarlett.jpg" />
        <div>
          <p>Ty</p>
          <h2>{playerName}</h2>
          <span>Wybór postaci wkrótce</span>
        </div>
      </section>
      <button className="secondary-action" onClick={onLeave} type="button">
        Opuść poczekalnię
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
  ) {
    return payload.message;
  }
  return "Nie udało się wykonać tej akcji.";
}
