import type { PlayerSummary } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { CharacterAvatar } from "../cards/index.js";
import { lobbyMessages } from "./i18n.js";

type Props = { player: PlayerSummary; isMe: boolean; isHost: boolean };

/** Nick with a round avatar; an empty ring means no character chosen yet. */
export function PlayerRow({ player, isMe, isHost }: Props) {
  const t = useT(lobbyMessages);
  return (
    <li className="flex min-w-0 items-center gap-2 text-lg">
      {player.characterId ? (
        <CharacterAvatar id={player.characterId} />
      ) : (
        <span className="size-7 shrink-0 rounded-full border border-line" aria-hidden="true" />
      )}
      <span className={`truncate ${isMe ? "font-bold" : ""}`}>{player.name}</span>
      {isMe ? <span className="text-sm text-muted">{t("you")}</span> : null}
      {isHost ? <span className="text-sm text-brand-strong">{t("host")}</span> : null}
    </li>
  );
}
