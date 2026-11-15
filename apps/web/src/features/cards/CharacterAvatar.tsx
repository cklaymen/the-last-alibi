import type { CharacterId } from "@mystery-game/game";
import { useT } from "../../shared/i18n/index.js";
import { characterColorVar } from "./cardArt.js";
import { cardMessages } from "./i18n.js";

type Props = { id: CharacterId; size?: number; className?: string };

/** Round avatar filled with the character's colour (placeholder art). */
export function CharacterAvatar({ id, size = 28, className = "" }: Props) {
  const t = useT(cardMessages);
  return (
    <span
      role="img"
      aria-label={t(id)}
      className={`inline-block shrink-0 rounded-full border border-line ${className}`}
      style={{ width: size, height: size, background: characterColorVar[id] }}
    />
  );
}
