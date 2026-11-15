import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "icon";

const base =
  "flex items-center justify-center rounded disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted";

const variants: Record<Variant, string> = {
  primary:
    "h-22.25 w-full bg-brand text-2xl font-bold tracking-[3.6px] text-on-brand hover:bg-brand-hover",
  secondary:
    "min-h-14 w-full border border-brand bg-surface text-xl font-bold text-brand-strong hover:bg-surface-2",
  icon: "h-22.25 w-21.75 shrink-0 rounded-none bg-brand text-on-brand hover:bg-brand-hover focus-visible:-outline-offset-6 focus-visible:outline-on-brand",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
