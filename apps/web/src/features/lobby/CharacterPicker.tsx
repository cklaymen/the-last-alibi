import { characterIds, type CharacterId, type RoomSummary } from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { CharacterCard } from "./CharacterCard.js";
import { lobbyMessages } from "./i18n.js";

type Props = {
  players: RoomSummary["players"];
  myId: string;
  onChoose: (id: CharacterId) => void;
};

export function CharacterPicker({ players, myId, onChoose }: Props) {
  const t = useT(lobbyMessages);
  return (
    <section aria-label={t("select_character")}>
      <h2 className="m-0 mb-2 text-lg font-normal">
        {t("select_character")}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {characterIds.map((id) => {
          const owner = players.find((p) => p.characterId === id);
          return (
            <CharacterCard
              key={id}
              id={id}
              isMine={owner?.id === myId}
              isTaken={owner !== undefined && owner.id !== myId}
              onChoose={onChoose}
            />
          );
        })}
      </div>
    </section>
  );
}
