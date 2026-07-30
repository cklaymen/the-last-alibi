import { DoorOpen, Play, Plus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  characterIds,
  type CharacterId,
  type RoomSummary,
} from "@mystery-game/contracts";
import { t } from "../i18n/index.js";

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
            action === "create" ? { playerName } : { playerName, roomCode },
          ),
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(readMessage(payload));
      setRoom(payload as RoomSummary);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t("err_connect"),
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
        <p className="eyebrow">{t("welcome_eyebrow")}</p>
        <h1>{t("welcome_title")}</h1>
        <p className="lead">{t("welcome_lead")}</p>
      </header>
      <section className="entry-panel" aria-label="Join a game">
        <label htmlFor="player-name">{t("your_nickname")}</label>
        <input
          id="player-name"
          autoComplete="nickname"
          maxLength={24}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder={t("nickname_placeholder")}
          value={playerName}
        />
        <button
          className="primary-action"
          disabled={playerName.trim().length < 2 || isLoading}
          onClick={() => void submit("create")}
          type="button"
        >
          <Plus aria-hidden="true" /> {t("create_room")}
        </button>
        <div className="join-divider">
          <span>{t("or")}</span>
        </div>
        <label htmlFor="room-code">{t("room_code")}</label>
        <div className="join-row">
          <input
            id="room-code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) =>
              setRoomCode(event.target.value.replace(/\D/g, ""))
            }
            placeholder={t("room_code_placeholder")}
            value={roomCode}
          />
          <button
            aria-label={t("join_room")}
            className="icon-action"
            disabled={
              playerName.trim().length < 2 || roomCode.length < 4 || isLoading
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

  const isHost =
    currentRoom.players.find((p) => p.name === playerName)?.id ===
    currentRoom.players.find((p) => p.name === currentRoom.hostName)?.id;
  const myCharacter = currentRoom.players.find(
    (p) => p.name === playerName,
  )?.characterId;
  const allHaveCharacters =
    currentRoom.players.length >= 2 &&
    currentRoom.players.every((p) => p.characterId != null);
  const canStart = isHost && currentRoom.phase === "LOBBY" && allHaveCharacters;

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
    socket.on("connect_error", () => setConnectionError(t("err_live_updates")));
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

  function chooseCharacter(characterId: CharacterId) {
    socketRef.current?.emit("character:choose", {
      roomCode: currentRoom.code,
      playerName,
      characterId,
    });
  }

  return (
    <main className="lobby-shell">
      <header className="lobby-header">
        <p className="eyebrow">{t("waiting_room")}</p>
        <h1>
          {t("room_heading")} {currentRoom.code}
        </h1>
        <p>{t("share_code_hint")}</p>
      </header>

      <section className="room-status" aria-label="Players in this room">
        <Users aria-hidden="true" />
        <div>
          <strong>
            {currentRoom.playerCount} / {currentRoom.maxPlayers}
          </strong>
          <span> {t("players_in_room")}</span>
        </div>
      </section>

      {currentRoom.phase === "LOBBY" ? (
        <section
          className="character-selection"
          aria-label={t("choose_character")}
        >
          <p className="section-label">{t("choose_character")}</p>
          <div className="character-grid">
            {characterIds.map((id) => {
              const takenBy = currentRoom.players.find(
                (p) => p.characterId === id,
              );
              const isMine = myCharacter === id;
              const isTakenByOther =
                takenBy !== undefined && takenBy.name !== playerName;
              return (
                <button
                  key={id}
                  className={`character-card char-${id}${
                    isMine ? " selected" : ""
                  }${isTakenByOther ? " taken" : ""}`}
                  disabled={isTakenByOther}
                  onClick={() => chooseCharacter(id)}
                  type="button"
                  aria-pressed={isMine}
                >
                  <span className="char-name">{t(`character_${id}`)}</span>
                  {isTakenByOther && takenBy ? (
                    <span className="char-taken-by">{takenBy.name}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="players-list" aria-label="Players">
        {currentRoom.players.map((player) => (
          <div key={player.id} className="player-row">
            <span className="player-row-name">
              {player.name}
              {player.name === playerName ? (
                <span className="you-badge">{t("you_label")}</span>
              ) : null}
            </span>
            <span
              className={`player-row-char${
                player.characterId ? ` char-${player.characterId}` : ""
              }`}
            >
              {player.characterId
                ? t(`character_${player.characterId}`)
                : t("no_character")}
            </span>
          </div>
        ))}
      </section>

      {currentRoom.phase === "IN_PROGRESS" ? (
        <p className="phase-banner">{t("game_in_progress")}</p>
      ) : null}

      {connectionError ? (
        <p className="error" role="alert">
          {connectionError}
        </p>
      ) : null}

      {isHost && currentRoom.phase === "LOBBY" ? (
        <button
          className="primary-action"
          disabled={!canStart}
          onClick={startGame}
          type="button"
        >
          <Play aria-hidden="true" /> {t("start_game")}
        </button>
      ) : null}

      <button className="secondary-action" onClick={onLeave} type="button">
        {t("leave_waiting_room")}
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
  return t("err_action");
}
