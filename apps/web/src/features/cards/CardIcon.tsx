import type { CardId } from "@mystery-game/game";
import { cardIcon, isCharacter } from "./cardArt.js";
import { CharacterAvatar } from "./CharacterAvatar.js";

type Props = { id: CardId; size?: number };

/** Decorative card glyph: avatar for suspects, icon for weapons/rooms (aria-hidden). */
export function CardIcon({ id, size = 20 }: Props) {
  if (isCharacter(id))
    return (
      <span aria-hidden="true" className="inline-flex shrink-0" data-card-icon={id}>
        <CharacterAvatar id={id} size={size} />
      </span>
    );
  const Icon = cardIcon[id];
  return (
    <Icon
      aria-hidden="true"
      data-card-icon={id}
      className="shrink-0 text-brand"
      style={{ width: size, height: size }}
    />
  );
}
