import {
  characterIds,
  type CharacterId,
  type RoomSummary,
} from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";
import { CharacterCard } from "./CharacterCard.js";

type Props = {
  players: RoomSummary["players"];
  playerName: string;
  onChoose: (id: CharacterId) => void;
};

export function CharacterPicker({ players, playerName, onChoose }: Props) {
  return (
    <section aria-label={t("choose_character")}>
      <p className="mb-3 text-[.72rem] font-medium uppercase tracking-[.14em] text-accent">
        {t("choose_character")}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {characterIds.map((id) => {
          const owner = players.find((p) => p.characterId === id);
          return (
            <CharacterCard
              key={id}
              id={id}
              isMine={owner?.name === playerName}
              takenBy={owner && owner.name !== playerName ? owner.name : null}
              onChoose={onChoose}
            />
          );
        })}
      </div>
    </section>
  );
}
