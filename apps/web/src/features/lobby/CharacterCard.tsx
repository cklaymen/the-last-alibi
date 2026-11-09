import type { CharacterId } from "@mystery-game/contracts";
import check from "../../shared/assets/check.svg";
import { t } from "../../i18n/index.js";

type Props = {
  id: CharacterId;
  image: string;
  isMine: boolean;
  isTaken: boolean;
  onChoose: (id: CharacterId) => void;
};

export function CharacterCard({ id, image, isMine, isTaken, onChoose }: Props) {
  return (
    <button
      type="button"
      aria-label={t(`character_${id}`)}
      aria-pressed={isMine}
      disabled={isTaken}
      onClick={() => onChoose(id)}
      className={`relative h-36.5 w-22 shrink-0 rounded border border-white p-0 ${
        isTaken ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-[-1px] size-[calc(100%+2px)] rounded object-cover"
      />
      {isMine ? (
        <>
          <span className="absolute inset-[-1px] rounded bg-brand/50" />
          <img
            src={check}
            alt=""
            className="absolute top-11.25 left-4 size-13.5 max-w-none"
          />
        </>
      ) : null}
    </button>
  );
}
