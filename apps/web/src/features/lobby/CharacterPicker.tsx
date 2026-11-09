import type { CharacterId, RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { CharacterCard } from "./CharacterCard.js";
import { characterTiles } from "./characterImages.js";

type Props = {
  players: RoomSummary["players"];
  playerName: string;
  onChoose: (id: CharacterId) => void;
};

export function CharacterPicker({ players, playerName, onChoose }: Props) {
  return (
    <section aria-label={t("choose_character")}>
      <p className="m-0 mb-1 text-lg">{t("choose_character")}</p>
      <div className="flex gap-1 overflow-x-auto">
        {characterTiles.map(({ id, image }) => {
          const owner = players.find((p) => p.characterId === id);
          return (
            <CharacterCard
              key={id}
              id={id}
              image={image}
              isMine={owner?.name === playerName}
              isTaken={owner !== undefined && owner.name !== playerName}
              onChoose={onChoose}
            />
          );
        })}
      </div>
    </section>
  );
}
