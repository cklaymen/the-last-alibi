import type { CSSProperties } from "react";
import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { characterColors } from "./characterColors.js";

type Props = { player: RoomSummary["players"][number]; isYou: boolean };

export function PlayerRow({ player, isYou }: Props) {
  const color = player.characterId
    ? characterColors[player.characterId]
    : "#69766d";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#f0f4f0] px-4.5 py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-[.88rem]">
        {player.name}
        {isYou ? (
          <span className="rounded-full border border-brand bg-brand-soft px-1.75 py-px text-[.65rem] uppercase tracking-[.06em] text-brand-dark">
            {t("you_label")}
          </span>
        ) : null}
      </span>
      <span
        style={{ "--c": color } as CSSProperties}
        className="rounded-full bg-[color-mix(in_srgb,var(--c)_14%,white)] px-2.5 py-0.75 text-[.72rem] text-[color-mix(in_srgb,var(--c)_80%,#1d3024)]"
      >
        {player.characterId
          ? t(`character_${player.characterId}`)
          : t("no_character")}
      </span>
    </div>
  );
}
