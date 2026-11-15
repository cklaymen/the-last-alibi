import { useId, useState } from "react";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import {
  ModalDialog,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../shared/ui/ModalDialog.js";
import { nicknameMessages } from "./i18n.js";
import { saveNickname } from "./storage.js";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;

type Props = {
  current: string;
  /** Sends `room:rename`; resolves with the server ack. */
  rename: (name: string) => Promise<{ ok: true } | { ok: false; code: string }>;
  onClose: () => void;
};

/** Dialog "Change nickname": textbox "Nickname", Save / Cancel, server errors in an alert. */
export function RenameDialog({ current, rename, onClose }: Props) {
  const t = useT(nicknameMessages);
  const errorText = useErrorText();
  const formId = useId();
  const inputId = useId();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const name = value.trim();
  const valid = name.length >= NICKNAME_MIN && name.length <= NICKNAME_MAX;

  async function submit() {
    if (!valid || busy) return;
    if (name === current) return onClose();
    setBusy(true);
    setErrorCode(null);
    const result = await rename(name);
    setBusy(false);
    if (result.ok) {
      saveNickname(name);
      onClose();
    } else {
      setErrorCode(result.code);
    }
  }

  return (
    <ModalDialog
      title={t("change")}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            form={formId}
            className={primaryButtonClass}
            disabled={!valid || busy}
          >
            {t("save")}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={inputId} className="font-bold">
          {t("field")}
        </label>
        <input
          id={inputId}
          autoComplete="nickname"
          maxLength={NICKNAME_MAX}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setErrorCode(null);
          }}
          className="min-h-11 w-full rounded border border-line bg-surface px-3 text-lg text-fg focus:border-brand"
        />
        {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
      </form>
    </ModalDialog>
  );
}
