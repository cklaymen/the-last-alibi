import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "icon";

const base =
  "inline-flex min-h-12 items-center justify-center font-medium disabled:cursor-not-allowed disabled:bg-[#e2e2e2] disabled:text-white";

const variants: Record<Variant, string> = {
  primary:
    "mt-5 w-full gap-2 rounded-[10px] bg-brand px-4.5 tracking-[.08em] text-white transition-colors enabled:hover:bg-brand-hover",
  secondary:
    "w-fit rounded-lg border border-accent bg-transparent px-4.5 text-brand-dark",
  icon: "rounded-lg bg-brand text-white",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant: Variant };

export function Button({ variant, className = "", ...props }: Props) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
