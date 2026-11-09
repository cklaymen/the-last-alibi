import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { PlayerRow } from "./PlayerRow.js";

type Props = { players: RoomSummary["players"]; playerName: string };

export function PlayerList({ players, playerName }: Props) {
  return (
    <section aria-label={t("players_label")}>
      <p className="m-0 mb-1 text-lg">{t("players_label")}</p>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0">
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isMe={player.name === playerName}
          />
        ))}
      </ul>
    </section>
  );
}
