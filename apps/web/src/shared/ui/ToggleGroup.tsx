import type { ReactNode } from "react";

type Option<T extends string> = { id: T; label: string; content: ReactNode };

type Props<T extends string> = {
  /** Accessible name of the group. */
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (id: T) => void;
};

/** Segmented control of buttons with aria-pressed; each named by its `label`. */
export function ToggleGroup<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex rounded border border-line bg-surface p-0.5">
      {options.map((option) => {
        const pressed = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={pressed}
            title={option.label}
            onClick={() => onChange(option.id)}
            className={`flex size-11 items-center justify-center rounded-sm ${
              pressed ? "bg-brand text-on-brand" : "text-muted hover:text-fg"
            }`}
          >
            {option.content}
          </button>
        );
      })}
    </div>
  );
}
