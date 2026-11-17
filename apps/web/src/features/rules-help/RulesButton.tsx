import { useContext, useState } from "react";
import { CircleHelp } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { ModalDialog, secondaryButtonClass } from "../../shared/ui/ModalDialog.js";
import { GameContext } from "../game/index.js";
import { rulesHelpMessages } from "./i18n.js";
import { rulesItems } from "./rulesItems.js";

/** Header button opening a short rules summary; room-setting lines follow the current room. */
export function RulesButton() {
  const t = useT(rulesHelpMessages);
  const settings = useContext(GameContext)?.room.settings ?? null;
  const [open, setOpen] = useState(false);
  const items = rulesItems(settings);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("button")}
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded text-fg hover:bg-surface-2"
      >
        <CircleHelp aria-hidden="true" className="size-5" />
      </button>
      {open && (
        <ModalDialog
          title={t("title")}
          onClose={close}
          footer={
            <button type="button" className={secondaryButtonClass} onClick={close}>
              {t("close")}
            </button>
          }
        >
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {items
              .filter((i) => !i.optional)
              .map((i) => (
                <li key={i.key}>{t(i.key, i.params)}</li>
              ))}
          </ul>
          <h3 className="m-0 text-sm font-bold text-muted">{t("inThisRoom")}</h3>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
            {items
              .filter((i) => i.optional)
              .map((i) => (
                <li key={i.key} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-bold text-brand-strong">
                    {t("roomSetting")}
                    <span className="sr-only">:</span>
                  </span>
                  <span>{t(i.key, i.params)}</span>
                </li>
              ))}
          </ul>
        </ModalDialog>
      )}
    </>
  );
}
