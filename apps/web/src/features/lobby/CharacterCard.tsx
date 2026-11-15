import type { CharacterId } from "@mystery-game/contracts";
import { Check } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { CharacterAvatar, cardMessages } from "../cards/index.js";

type Props = {
  id: CharacterId;
  isMine: boolean;
  isTaken: boolean;
  onChoose: (id: CharacterId) => void;
};

/** Button named by the character; pressed when mine, disabled when taken by someone else. */
export function CharacterCard({ id, isMine, isTaken, onChoose }: Props) {
  const t = useT(cardMessages);
  return (
    <button
      type="button"
      aria-label={t(id)}
      aria-pressed={isMine}
      disabled={isTaken}
      onClick={() => onChoose(id)}
      className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded border p-2 text-center text-sm ${
        isMine
          ? "border-brand bg-brand/20 text-fg"
          : "border-line bg-surface text-fg hover:border-brand"
      } ${isTaken ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span aria-hidden="true">
        <CharacterAvatar id={id} size={44} />
      </span>
      <span className="leading-tight">{t(id)}</span>
      {isMine ? (
        <Check
          aria-hidden="true"
          className="absolute top-1 right-1 size-5 rounded-full bg-brand p-0.5 text-on-brand"
        />
      ) : null}
    </button>
  );
}
