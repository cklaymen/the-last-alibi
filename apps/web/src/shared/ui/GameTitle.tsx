/** Working title of the game (placeholder identity – change here only). */
export const GAME_TITLE = "The Last Alibi";

export function GameTitle({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[1.5px] text-brand-strong ${className}`}>
      {GAME_TITLE}
    </span>
  );
}
