import type { PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import { myRoom } from "../board/index.js";
import { CardTile } from "../cards/index.js";
import { useT } from "../../shared/i18n/index.js";
import { roomCardMessages } from "./i18n.js";

type Props = { game: PublicGameState; me: PrivateGameState; myId: string };

/** Private peek at the face-down card in the room my pawn stands in now (server sends only visited rooms). */
export function RoomCardPeek({ game, me, myId }: Props) {
  const t = useT(roomCardMessages);
  const roomId = myRoom(game, myId);
  const card = roomId ? me.roomCards.find((r) => r.roomId === roomId) : undefined;
  if (!card) return null;
  return (
    <section aria-label={t("region")} className="flex flex-wrap items-center gap-2 rounded border border-line bg-surface-2 p-3">
      <span className="font-bold">{t("label")}</span>
      <CardTile id={card.cardId} compact />
    </section>
  );
}
