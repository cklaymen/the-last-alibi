import { useState } from "react";
import type { SuggestCommand } from "@mystery-game/contracts";
import {
  characterIds,
  weaponIds,
  type CharacterId,
  type RoomId,
  type WeaponId,
} from "@mystery-game/game";
import { CardSelectGrid, CardTile, cardMessages } from "../cards/index.js";
import { useT } from "../../shared/i18n/index.js";
import { suggestionMessages } from "./i18n.js";
import { ModalDialog, primaryButtonClass, secondaryButtonClass } from "../../shared/ui/ModalDialog.js";

type Props = {
  /** The room my pawn is in (fixed part of the suggestion). */
  room: RoomId;
  onSubmit: (s: SuggestCommand) => void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
};

export function SuggestionDialog({ room, onSubmit, onClose, busy = false, error = null }: Props) {
  const t = useT(suggestionMessages);
  const card = useT(cardMessages);
  const [suspect, setSuspect] = useState<CharacterId | null>(null);
  const [weapon, setWeapon] = useState<WeaponId | null>(null);

  return (
    <ModalDialog
      title={t("title")}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!suspect || !weapon || busy}
            onClick={() => suspect && weapon && onSubmit({ suspect, weapon })}
          >
            {t("confirm")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold text-muted">{t("suspect")}</h3>
        <CardSelectGrid label={t("suspect")} options={characterIds} value={suspect} onChange={setSuspect} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold text-muted">{t("weapon")}</h3>
        <CardSelectGrid label={t("weapon")} options={weaponIds} value={weapon} onChange={setWeapon} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold text-muted">{t("roomLabel")}</h3>
        <div className="max-w-60">
          <CardTile id={room} />
        </div>
        <p className="m-0 text-sm text-muted">{t("roomHint", { room: card(room) })}</p>
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      )}
    </ModalDialog>
  );
}
