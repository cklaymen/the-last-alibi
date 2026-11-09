import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { CharacterId, RoomSummary } from "@mystery-game/contracts";
import { apiUrl } from "../../config.js";
import { t } from "../../i18n/index.js";

export function useRoomSocket(initialRoom: RoomSummary, playerName: string) {
  const [room, setRoom] = useState(initialRoom);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(apiUrl);
    socketRef.current = socket;
    socket.on("connect", () =>
      socket.emit("room:subscribe", { roomCode: initialRoom.code }),
    );
    socket.on("room:state", (nextRoom: RoomSummary) => {
      setRoom(nextRoom);
      setConnectionError(null);
    });
    socket.on("connect_error", () => setConnectionError(t("err_live_updates")));
    return () => {
      socket.close();
    };
  }, [initialRoom.code]);

  return {
    room,
    connectionError,
    startGame: () =>
      socketRef.current?.emit("room:start", { roomCode: room.code, playerName }),
    chooseCharacter: (characterId: CharacterId) =>
      socketRef.current?.emit("character:choose", {
        roomCode: room.code,
        playerName,
        characterId,
      }),
  };
}
