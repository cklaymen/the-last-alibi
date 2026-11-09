import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "icon";

const base =
  "flex h-22.25 items-center justify-center rounded bg-brand text-white disabled:cursor-not-allowed disabled:bg-disabled";

const variants: Record<Variant, string> = {
  primary: "w-full text-2xl font-bold tracking-[3.6px]",
  icon: "w-21.75 shrink-0 rounded-none focus-visible:-outline-offset-6 focus-visible:outline-white",
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
