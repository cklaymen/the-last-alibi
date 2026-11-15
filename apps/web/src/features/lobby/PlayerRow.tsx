import type { PlayerSummary } from "@mystery-game/contracts";
import { UserMinus, WifiOff } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { CharacterAvatar } from "../cards/index.js";
import { lobbyMessages } from "./i18n.js";

type Props = {
  player: PlayerSummary;
  isMe: boolean;
  isHost: boolean;
  /** Present when I may remove this player (I am the host, it is not me). */
  onKick?: (() => void) | undefined;
  kickDisabled?: boolean;
};

/** Nick with a round avatar; an empty ring means no character chosen yet. */
export function PlayerRow({ player, isMe, isHost, onKick, kickDisabled = false }: Props) {
  const t = useT(lobbyMessages);
  const offline = player.presence !== "online";
  return (
    <li className="flex min-w-0 items-center gap-2 text-lg">
      <span className={`inline-flex shrink-0 ${offline ? "opacity-40 grayscale" : ""}`}>
        {player.characterId ? (
          <CharacterAvatar id={player.characterId} />
        ) : (
          <span className="size-7 shrink-0 rounded-full border border-line" aria-hidden="true" />
        )}
      </span>
      <span className={`truncate ${isMe ? "font-bold" : ""} ${offline ? "text-muted" : ""}`}>
        {player.name}
      </span>
      {isMe ? <span className="text-sm text-muted">{t("you")}</span> : null}
      {isHost ? <span className="text-sm text-brand-strong">{t("host")}</span> : null}
      {offline ? (
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <WifiOff aria-hidden="true" className="size-4 shrink-0" />
          {t("offline")}
        </span>
      ) : null}
      {onKick ? (
        <button
          type="button"
          aria-label={t("remove", { name: player.name })}
          title={t("remove", { name: player.name })}
          disabled={kickDisabled}
          onClick={onKick}
          className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded border border-line bg-surface text-danger hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted"
        >
          <UserMinus aria-hidden="true" className="size-5" />
        </button>
      ) : null}
    </li>
  );
}
