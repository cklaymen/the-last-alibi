import { markSymbol, type Mark } from "./notebookModel.js";

const tone: Record<Mark, string> = {
  empty: "text-muted",
  has: "text-brand-strong",
  not: "text-danger",
  maybe: "text-fg",
};

type Props = {
  label: string;
  mark: Mark;
  source: "manual" | "auto";
  /** "Shown to me" fact: drawn with an outline. */
  shown?: boolean;
  /** Missing = locked (my own card). */
  onToggle?: (() => void) | undefined;
};

/** One notebook cell: manual marks are full strength, automatic ones lighter. */
export function NotebookCell({ label, mark, source, shown = false, onToggle }: Props) {
  const symbol = (
    <span
      aria-hidden="true"
      className={`inline-flex size-6 items-center justify-center rounded font-bold ${tone[mark]} ${
        source === "auto" ? "opacity-55" : ""
      } ${shown ? "outline-2 outline-brand-strong" : ""}`}
    >
      {mark === "empty" ? <span className="opacity-40">·</span> : markSymbol[mark]}
    </span>
  );
  if (!onToggle)
    return (
      <span role="img" aria-label={label} className="flex h-9 items-center justify-center">
        {symbol}
      </span>
    );
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className="flex h-9 w-full items-center justify-center rounded hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand"
    >
      {symbol}
    </button>
  );
}
