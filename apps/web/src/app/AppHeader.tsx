import type { ReactNode } from "react";
import { LocaleSwitcher } from "../features/locale/index.js";
import { RulesButton } from "../features/rules-help/index.js";
import { ThemeSwitcher } from "../features/theme/index.js";
import { GameTitle } from "../shared/ui/GameTitle.js";

type Props = {
  /** Room-only controls (the nickname button); the title gives way to them below `sm`. */
  roomSlot?: ReactNode;
};

/** Shown on every screen: title (+ nickname in a room) and rules button and language/theme switchers (fits 375px). */
export function AppHeader({ roomSlot }: Props) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-2 py-1 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <GameTitle
          className={`min-w-0 truncate text-base sm:text-xl ${roomSlot ? "hidden sm:inline" : ""}`}
        />
        {roomSlot}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <RulesButton />
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
