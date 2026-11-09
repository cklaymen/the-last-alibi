import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { PlayerRow } from "./PlayerRow.js";

type Props = { players: RoomSummary["players"]; playerName: string };

export function PlayerList({ players, playerName }: Props) {
  return (
    <section
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-white"
      aria-label={t("players_label")}
    >
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          isYou={player.name === playerName}
        />
      ))}
    </section>
  );
}
