import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { characterImage } from "./characterImages.js";

type Props = { player: RoomSummary["players"][number]; isMe: boolean };

/** Nick with a round avatar; an empty ring means no character chosen yet. */
export function PlayerRow({ player, isMe }: Props) {
  const { characterId } = player;
  return (
    <li className="flex min-w-0 items-center gap-2 text-lg">
      {characterId ? (
        <img
          src={characterImage(characterId)}
          alt={t(`character_${characterId}`)}
          className="size-7 shrink-0 rounded-full object-cover object-[50%_12.5%]"
        />
      ) : (
        <span
          className="size-7 shrink-0 rounded-full border border-line"
          aria-hidden="true"
        />
      )}
      <span className={`truncate ${isMe ? "font-bold" : ""}`}>
        {player.name}
      </span>
    </li>
  );
}
