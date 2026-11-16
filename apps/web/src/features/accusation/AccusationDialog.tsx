import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import type { AccuseCommand } from "@mystery-game/contracts";
import {
  characterIds,
  roomIds,
  weaponIds,
  type CharacterId,
  type RoomId,
  type WeaponId,
} from "@mystery-game/game";
import { CardSelectGrid } from "../cards/index.js";
import { useCardAnnotations } from "../suggestion/index.js";
import { ModalDialog, primaryButtonClass, secondaryButtonClass } from "../../shared/ui/ModalDialog.js";
import { useT } from "../../shared/i18n/index.js";
import { accusationMessages } from "./i18n.js";

type Props = {
  onSubmit: (a: AccuseCommand) => void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
  /** House rule "named_room": the accused room is the current one and cannot be changed. */
  lockedRoom?: RoomId | undefined;
};

export function AccusationDialog({ onSubmit, onClose, busy = false, error = null, lockedRoom }: Props) {
  const t = useT(accusationMessages);
  const annotate = useCardAnnotations();
  const [suspect, setSuspect] = useState<CharacterId | null>(null);
  const [weapon, setWeapon] = useState<WeaponId | null>(null);
  const [room, setRoom] = useState<RoomId | null>(lockedRoom ?? null);

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
            disabled={!suspect || !weapon || !room || busy}
            onClick={() => suspect && weapon && room && onSubmit({ suspect, weapon, room })}
          >
            {t("confirm")}
          </button>
        </>
      }
    >
      <p className="m-0 flex items-start gap-2 rounded border border-danger p-3 text-sm text-danger">
        <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
        {t("warning")}
      </p>
      <Group title={t("suspect")}>
        <CardSelectGrid label={t("suspect")} options={characterIds} value={suspect} onChange={setSuspect} annotate={annotate} />
      </Group>
      <Group title={t("weapon")}>
        <CardSelectGrid label={t("weapon")} options={weaponIds} value={weapon} onChange={setWeapon} annotate={annotate} />
      </Group>
      <Group title={t("room")}>
        <CardSelectGrid
          label={t("room")}
          options={roomIds}
          value={room}
          onChange={setRoom}
          annotate={annotate}
          disabled={lockedRoom !== undefined}
        />
      </Group>
      {error && (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      )}
    </ModalDialog>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-sm font-bold text-muted">{title}</h3>
      {children}
    </div>
  );
}
