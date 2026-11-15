import { useState } from "react";
import { UserPen } from "lucide-react";
import { useGame } from "../game/index.js";
import { useT } from "../../shared/i18n/index.js";
import { nicknameMessages } from "./i18n.js";
import { RenameDialog } from "./RenameDialog.js";

/** Top-bar button named "Change nickname" showing my current nickname; opens RenameDialog. */
export function NicknameButton() {
  const t = useT(nicknameMessages);
  const { room, myId, send } = useGame();
  const [open, setOpen] = useState(false);
  const name = room.players.find((p) => p.id === myId)?.name ?? "";

  return (
    <>
      <button
        type="button"
        aria-label={t("change")}
        title={t("change")}
        onClick={() => setOpen(true)}
        className="flex min-h-11 min-w-0 items-center gap-1 rounded border border-line bg-surface px-2 font-bold text-fg hover:bg-surface-2"
      >
        <UserPen aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 truncate">{name}</span>
      </button>
      {open && (
        <RenameDialog
          current={name}
          rename={(next) => send("room:rename", { name: next })}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
