import { useEffect } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useT } from "../../shared/i18n/index.js";
import { ToggleGroup } from "../../shared/ui/ToggleGroup.js";
import { themeMessages } from "./i18n.js";
import {
  setThemePreference,
  themePreferences,
  useThemePreference,
  watchSystemTheme,
  type ThemePreference,
} from "./theme.js";

const icons: Record<ThemePreference, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/** Light / Dark / System buttons (aria-pressed); icon-only, named by aria-label. */
export function ThemeSwitcher() {
  const t = useT(themeMessages);
  const pref = useThemePreference();
  useEffect(watchSystemTheme, []);

  return (
    <ToggleGroup
      label={t("group")}
      value={pref}
      options={themePreferences.map((id) => {
        const Icon = icons[id];
        return {
          id,
          label: t(id),
          content: <Icon aria-hidden="true" className="size-5" />,
        };
      })}
      onChange={setThemePreference}
    />
  );
}
