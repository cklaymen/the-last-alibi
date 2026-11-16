import { useState } from "react";
import { Gavel, Search } from "lucide-react";
import { AccusationDialog } from "../../accusation/index.js";
import { myRoom } from "../../board/index.js";
import { SuggestionDialog } from "../../suggestion/index.js";
import { primaryButtonClass, secondaryButtonClass } from "../../../shared/ui/ModalDialog.js";
import { useT } from "../../../shared/i18n/index.js";
import { turnMessages } from "../i18n.js";
import type { ActionProps } from "../types.js";
import { useCommand } from "../useCommand.js";

export function SuggestAction({ game, myId, send }: ActionProps) {
  const t = useT(turnMessages);
  const [open, setOpen] = useState(false);
  const { run, busy, error, clearError } = useCommand(send);
  const room = myRoom(game, myId);
  const close = () => {
    clearError();
    setOpen(false);
  };
  return (
    <>
      <button type="button" className={primaryButtonClass} disabled={!room} onClick={() => setOpen(true)}>
        <Search aria-hidden="true" className="size-5" />
        {t("suggest")}
      </button>
      {open && room && (
        <SuggestionDialog
          room={room}
          busy={busy}
          error={error}
          onClose={close}
          onSubmit={async (s) => {
            if (await run("turn:suggest", s)) setOpen(false);
          }}
        />
      )}
    </>
  );
}

export function AccuseAction({ game, myId, send }: ActionProps) {
  const t = useT(turnMessages);
  const lockedRoom =
    game.settings.accusationPlace === "named_room" ? (myRoom(game, myId) ?? undefined) : undefined;
  const [open, setOpen] = useState(false);
  const { run, busy, error, clearError } = useCommand(send);
  const close = () => {
    clearError();
    setOpen(false);
  };
  return (
    <>
      <button type="button" className={secondaryButtonClass} onClick={() => setOpen(true)}>
        <Gavel aria-hidden="true" className="size-5" />
        {t("accuse")}
      </button>
      {open && (
        <AccusationDialog
          lockedRoom={lockedRoom}
          busy={busy}
          error={error}
          onClose={close}
          onSubmit={async (a) => {
            if (await run("turn:accuse", a)) setOpen(false);
          }}
        />
      )}
    </>
  );
}
