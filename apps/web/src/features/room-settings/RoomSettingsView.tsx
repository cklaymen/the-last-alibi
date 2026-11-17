import { useId } from "react";
import { Info } from "lucide-react";
import {
  MAX_ROOM_CARDS,
  accusationPlaces,
  disproveTimeLimits,
  turnTimeLimits,
  type RoomSettings,
  type UpdateSettingsRequest,
} from "@mystery-game/contracts";
import { useT } from "../../shared/i18n/index.js";
import { Tooltip } from "../../shared/ui/Tooltip.js";
import { roomSettingsMessages } from "./i18n.js";

const roomCardCounts = Array.from({ length: MAX_ROOM_CARDS + 1 }, (_, i) => i);

type Props = {
  settings: RoomSettings;
  /** Missing = read-only (all controls disabled). */
  onChange?: ((patch: UpdateSettingsRequest) => void) | undefined;
};

/** The house-rule controls with an explanation button each; used in the lobby and (read-only) in the game. */
export function RoomSettingsView({ settings, onChange }: Props) {
  const t = useT(roomSettingsMessages);
  const disabled = !onChange;
  const change = (patch: UpdateSettingsRequest) => onChange?.(patch);
  const seconds = (value: number | null) => (value === null ? t("limit_none") : t("seconds", { n: String(value) }));
  const row = (key: Parameters<typeof t>[0], infoKey: Parameters<typeof t>[0]) => ({
    label: t(key),
    info: t(infoKey),
    about: t("about", { setting: t(key) }),
    disabled,
  });

  return (
    <div className="grid gap-2 rounded border border-line bg-surface p-3">
      <SelectRow
        {...row("accusation_place", "info_accusation_place")}
        value={settings.accusationPlace}
        options={accusationPlaces.map((id) => ({ value: id, label: t(`place_${id}`) }))}
        onChange={(accusationPlace) => change({ accusationPlace })}
      />
      <CheckRow
        {...row("accuse_after_suggestion", "info_accuse_after_suggestion")}
        checked={settings.accuseAfterSuggestion}
        onChange={(accuseAfterSuggestion) => change({ accuseAfterSuggestion })}
      />
      <CheckRow
        {...row("suggest_after_staying", "info_suggest_after_staying")}
        checked={settings.suggestAfterStaying}
        onChange={(suggestAfterStaying) => change({ suggestAfterStaying })}
      />
      <SelectRow
        {...row("turn_time_limit", "info_turn_time_limit")}
        value={settings.turnTimeLimitSec}
        options={turnTimeLimits.map((value) => ({ value, label: seconds(value) }))}
        onChange={(turnTimeLimitSec) => change({ turnTimeLimitSec })}
      />
      <SelectRow
        {...row("disprove_time_limit", "info_disprove_time_limit")}
        value={settings.disproveTimeLimitSec}
        options={disproveTimeLimits.map((value) => ({ value, label: seconds(value) }))}
        onChange={(disproveTimeLimitSec) => change({ disproveTimeLimitSec })}
      />
      <SelectRow
        {...row("room_cards", "info_room_cards")}
        value={settings.roomCards}
        options={roomCardCounts.map((value) => ({ value, label: String(value) }))}
        onChange={(roomCards) => change({ roomCards })}
      />
      <CheckRow
        {...row("auto_notes", "info_auto_notes")}
        checked={settings.autoNotes}
        onChange={(autoNotes) => change({ autoNotes })}
      />
    </div>
  );
}

type RowBase = { label: string; info: string; about: string; disabled: boolean };

function InfoButton({ about, info }: { about: string; info: string }) {
  return (
    <Tooltip
      label={about}
      content={info}
      align="start"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-fg"
    >
      <Info aria-hidden="true" className="size-4" />
    </Tooltip>
  );
}

type SelectRowProps<T extends RoomSettings[keyof RoomSettings]> = RowBase & {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

/** `<select>` over typed values; option values are indices, so `null` survives the round trip. */
function SelectRow<T extends RoomSettings[keyof RoomSettings]>({
  label,
  info,
  about,
  disabled,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  const id = useId();
  const selected = options.findIndex((option) => option.value === value);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm">
          {label}
        </label>
        <InfoButton about={about} info={info} />
      </span>
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

type CheckRowProps = RowBase & { checked: boolean; onChange: (checked: boolean) => void };

function CheckRow({ label, info, about, disabled, checked, onChange }: CheckRowProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-1">
        <label htmlFor={id}>{label}</label>
        <InfoButton about={about} info={info} />
      </span>
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-[var(--brand-strong)]"
      />
    </div>
  );
}
