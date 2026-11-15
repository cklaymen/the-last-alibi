import type { RoomSummary } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { lobbyMessages } from "./i18n.js";
import { PlayerRow } from "./PlayerRow.js";

type Props = {
  room: RoomSummary;
  myId: string;
  /** Given only to the host: removes another player from the room. */
  onKick?: ((playerId: string) => void) | undefined;
  busy?: boolean;
};

export function PlayerList({ room, myId, onKick, busy = false }: Props) {
  const t = useT(lobbyMessages);
  return (
    <section aria-label={t("players")}>
      <h2 className="m-0 mb-2 text-lg font-normal">
        {t("players")} ({room.players.length}/{room.maxPlayers})
      </h2>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 min-[400px]:grid-cols-2">
        {room.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isMe={player.id === myId}
            isHost={player.id === room.hostId}
            onKick={onKick && player.id !== myId ? () => onKick(player.id) : undefined}
            kickDisabled={busy}
          />
        ))}
      </ul>
    </section>
  );
}
