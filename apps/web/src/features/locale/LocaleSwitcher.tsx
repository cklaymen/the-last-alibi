import { locales, setLocale, useLocale, useT } from "../../shared/i18n/index.js";
import { ToggleGroup } from "../../shared/ui/ToggleGroup.js";
import { localeMessages } from "./i18n.js";

/** EN / PL buttons (aria-pressed). Visible text is the short code. */
export function LocaleSwitcher() {
  const t = useT(localeMessages);
  const locale = useLocale();
  return (
    <ToggleGroup
      label={t("group")}
      value={locale}
      options={locales.map((id) => ({
        id,
        label: t(id),
        content: <span className="text-sm font-bold uppercase">{id}</span>,
      }))}
      onChange={setLocale}
    />
  );
}
