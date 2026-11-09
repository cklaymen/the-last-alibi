import { Users } from "lucide-react";
import { t } from "../../i18n/index.js";

type Props = { playerCount: number; maxPlayers: number };

export function RoomStatus({ playerCount, maxPlayers }: Props) {
  return (
    <section
      className="flex items-center gap-4 rounded-lg border border-line bg-white p-4.5"
      aria-label={t("players_label")}
    >
      <Users className="shrink-0 text-accent" aria-hidden="true" />
      <div>
        <strong className="text-xl">
          {playerCount} / {maxPlayers}
        </strong>
        <span className="text-[.78rem]"> {t("players_in_room")}</span>
      </div>
    </section>
  );
}
