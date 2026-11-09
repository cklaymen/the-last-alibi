import type { CSSProperties } from "react";
import type { CharacterId } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { characterColors } from "./characterColors.js";

type Props = {
  id: CharacterId;
  isMine: boolean;
  takenBy: string | null;
  onChoose: (id: CharacterId) => void;
};

export function CharacterCard({ id, isMine, takenBy, onChoose }: Props) {
  const isTaken = takenBy !== null;
  const bg = isMine
    ? "bg-[color-mix(in_srgb,var(--c)_22%,white)] border-(--c)"
    : "bg-[color-mix(in_srgb,var(--c)_12%,white)] border-transparent";
  return (
    <button
      type="button"
      style={{ "--c": characterColors[id] } as CSSProperties}
      className={`flex flex-col items-center gap-1.5 rounded-[10px] border-2 px-2 py-3.5 transition-[border-color,opacity] ${bg} ${
        isTaken
          ? "cursor-not-allowed opacity-50"
          : "hover:border-(--c)"
      }`}
      disabled={isTaken}
      onClick={() => onChoose(id)}
      aria-pressed={isMine}
    >
      <span className="text-center text-[.72rem] font-medium">
        {t(`character_${id}`)}
      </span>
      {takenBy ? (
        <span className="text-[.65rem] text-muted">{takenBy}</span>
      ) : null}
    </button>
  );
}
