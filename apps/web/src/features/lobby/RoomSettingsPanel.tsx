import { useId, useState } from "react";
import {
  MAX_ROOM_CARDS,
  accusationPlaces,
  disproveTimeLimits,
  turnTimeLimits,
  type RoomSettings,
  type UpdateSettingsRequest,
} from "@mystery-game/contracts";
import { useErrorText } from "../../shared/errors/index.js";
import { useT } from "../../shared/i18n/index.js";
import { ErrorMessage } from "../../shared/ui/ErrorMessage.js";
import { useGame } from "../game/index.js";
import { lobbyMessages } from "./i18n.js";

const roomCardCounts = Array.from({ length: MAX_ROOM_CARDS + 1 }, (_, i) => i);

/** House rules of the room. The host edits them (one-field patches); others see them read-only. */
export function RoomSettingsPanel() {
  const t = useT(lobbyMessages);
  const errorText = useErrorText();
  const { room, myId, send } = useGame();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const settings = room.settings;
  const readOnly = room.hostId !== myId;

  async function change(patch: UpdateSettingsRequest) {
    setErrorCode(null);
    const result = await send("room:settings", patch);
    if (!result.ok) setErrorCode(result.code);
  }

  const seconds = (value: number | null) =>
    value === null ? t("limit_none") : t("seconds", { n: String(value) });

  return (
    <section aria-label={t("settings")}>
      <h2 className="m-0 mb-2 text-lg font-normal">{t("settings")}</h2>
      <div className="grid gap-2 rounded border border-line bg-surface p-3">
        <SelectRow
          label={t("accusation_place")}
          disabled={readOnly}
          value={settings.accusationPlace}
          options={accusationPlaces.map((id) => ({ value: id, label: t(`place_${id}`) }))}
          onChange={(accusationPlace) => void change({ accusationPlace })}
        />
        <CheckRow
          label={t("accuse_after_suggestion")}
          disabled={readOnly}
          checked={settings.accuseAfterSuggestion}
          onChange={(accuseAfterSuggestion) => void change({ accuseAfterSuggestion })}
        />
        <CheckRow
          label={t("suggest_after_staying")}
          disabled={readOnly}
          checked={settings.suggestAfterStaying}
          onChange={(suggestAfterStaying) => void change({ suggestAfterStaying })}
        />
        <SelectRow
          label={t("turn_time_limit")}
          disabled={readOnly}
          value={settings.turnTimeLimitSec}
          options={turnTimeLimits.map((value) => ({ value, label: seconds(value) }))}
          onChange={(turnTimeLimitSec) => void change({ turnTimeLimitSec })}
        />
        <SelectRow
          label={t("disprove_time_limit")}
          disabled={readOnly}
          value={settings.disproveTimeLimitSec}
          options={disproveTimeLimits.map((value) => ({ value, label: seconds(value) }))}
          onChange={(disproveTimeLimitSec) => void change({ disproveTimeLimitSec })}
        />
        <SelectRow
          label={t("room_cards")}
          disabled={readOnly}
          value={settings.roomCards}
          options={roomCardCounts.map((value) => ({ value, label: String(value) }))}
          onChange={(roomCards) => void change({ roomCards })}
        />
        <CheckRow
          label={t("auto_notes")}
          disabled={readOnly}
          checked={settings.autoNotes}
          onChange={(autoNotes) => void change({ autoNotes })}
        />
        {errorCode ? <ErrorMessage message={errorText(errorCode)} /> : null}
      </div>
    </section>
  );
}

type SelectRowProps<T extends RoomSettings[keyof RoomSettings]> = {
  label: string;
  disabled: boolean;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

/** `<select>` over typed values; option values are indices, so `null` survives the round trip. */
function SelectRow<T extends RoomSettings[keyof RoomSettings]>({
  label,
  disabled,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  const id = useId();
  const selected = options.findIndex((option) => option.value === value);
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <select
        id={id}
        disabled={disabled}
        value={String(selected)}
        onChange={(e) => {
          const option = options[Number(e.target.value)];
          if (option) onChange(option.value);
        }}
        className="min-h-11 rounded border border-line bg-surface px-2 text-sm text-fg disabled:text-muted"
      >
        {options.map((option, i) => (
          <option key={option.label} value={String(i)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type CheckRowProps = {
  label: string;
  disabled: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckRow({ label, disabled, checked, onChange }: CheckRowProps) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      {label}
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-[var(--brand-strong)]"
      />
    </label>
  );
}
