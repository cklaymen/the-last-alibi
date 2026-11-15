import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** No border/radius of its own – the parent draws the frame (e.g. input + button group). */
  bare?: boolean;
};

const base =
  "h-22.25 w-full bg-surface px-5 text-2xl font-bold text-brand-strong placeholder:text-muted/50";
const boxed = "rounded border border-line transition-colors focus:border-brand";

export function TextField({ bare = false, className = "", ...props }: Props) {
  return (
    <input
      className={`${base} ${bare ? "min-w-0 flex-1" : boxed} ${className}`}
      {...props}
    />
  );
}
