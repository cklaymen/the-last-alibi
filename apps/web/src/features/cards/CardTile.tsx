import type { CardId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { cardIcon, cardKind, isCharacter } from "./cardArt.js";
import { CharacterAvatar } from "./CharacterAvatar.js";
import { cardMessages } from "./i18n.js";

type Props = { id: CardId; compact?: boolean };

/** Visual card: icon/avatar + name. Purely presentational. */
export function CardTile({ id, compact = false }: Props) {
  const t = useT(cardMessages);
  const kind = cardKind(id);
  const Icon = isCharacter(id) ? null : cardIcon[id];
  return (
    <span
      className={`flex items-center gap-2 rounded border border-line bg-surface text-fg ${
        compact ? "px-2 py-1 text-sm" : "min-h-11 px-3 py-2"
      }`}
      data-kind={kind}
    >
      {isCharacter(id) ? (
        <CharacterAvatar id={id} size={compact ? 18 : 24} />
      ) : Icon ? (
        <Icon aria-hidden="true" className="size-5 shrink-0 text-brand" />
      ) : null}
      <span className="truncate">{t(id)}</span>
    </span>
  );
}
