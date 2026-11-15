import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import {
  ServerEvents,
  type ClientToServerEvents,
  type CommandResult,
  type PrivateGameState,
  type PublicGameState,
  type RoomSummary,
  type ServerToClientEvents,
} from "@mystery-game/contracts";
import { apiUrl } from "../../config.js";
import { useSession, type ActiveSession } from "../session/index.js";
import { GameContext, type GameContextValue } from "./GameContext.js";

const ACK_TIMEOUT_MS = 8000;

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
/** Untyped view used only to emit with a timeout-aware ack. */
type LooseEmitter = {
  timeout: (ms: number) => {
    emit: (event: string, payload: unknown, ack: (err: unknown, result?: CommandResult) => void) => void;
  };
};

/**
 * Holds the one Socket.IO connection of the current session and provides
 * room/game state + `send()` through GameContext. Renders nothing without a session.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const { session, leave } = useSession();
  if (!session) return null;
  return (
    <ConnectedGame key={session.token} session={session} leave={leave}>
      {children}
    </ConnectedGame>
  );
}

type Props = { session: ActiveSession; leave: () => void; children: ReactNode };

function ConnectedGame({ session, leave, children }: Props) {
  const [room, setRoom] = useState<RoomSummary>(session.initialRoom);
  const [game, setGame] = useState<PublicGameState | null>(null);
  const [me, setMe] = useState<PrivateGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<GameSocket | null>(null);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  useEffect(() => {
    const socket: GameSocket = io(apiUrl, { auth: { token: session.token } });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (error) => {
      setConnected(false);
      if (error.message === "UNAUTHORIZED") leaveRef.current();
    });
    socket.on(ServerEvents.roomState, (next) => {
      setRoom(next);
      if (next.phase === "LOBBY") {
        setGame(null);
        setMe(null);
      }
    });
    socket.on(ServerEvents.gameState, (next) => {
      setGame(next);
      setMe((current) => (current && current.gameId !== next.gameId ? null : current));
    });
    socket.on(ServerEvents.gamePrivate, setMe);
    return () => {
      socket.removeAllListeners();
      socket.close();
      socketRef.current = null;
    };
  }, [session.token]);

  const value = useMemo<GameContextValue>(() => {
    const send: GameContextValue["send"] = (event, payload) =>
      new Promise<CommandResult>((resolve) => {
        const socket = socketRef.current as unknown as LooseEmitter | null;
        if (!socket) return resolve({ ok: false, code: "INTERNAL" });
        socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err, result) =>
          resolve(err || !result ? { ok: false, code: "INTERNAL" } : result),
        );
      });
    return {
      room,
      myId: session.playerId,
      game,
      me: me && game && me.gameId !== game.gameId ? null : me,
      connected,
      send,
      leave,
    };
  }, [room, game, me, connected, leave, session.playerId]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
