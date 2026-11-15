import { LocaleSwitcher } from "../features/locale/index.js";
import { ThemeSwitcher } from "../features/theme/index.js";
import { GameTitle } from "../shared/ui/GameTitle.js";

/** Shown on every screen: title + language and theme switchers (fits 375px). */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-2 py-1 sm:px-4">
      <GameTitle className="min-w-0 truncate text-base sm:text-xl" />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
