import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = {
  /** Accessible name of the trigger button. */
  label: string;
  content: ReactNode;
  /** Visible trigger content (initial, icon, …). */
  children: ReactNode;
  /** Horizontal anchor of the bubble; use "end" near the right edge, "start" near the left one. */
  align?: "start" | "center" | "end";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "content" | "children" | "type" | "onClick">;

const alignClass = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" } as const;

/**
 * The one tooltip behaviour of the HTML UI: mouse hover shows it, leaving hides it;
 * a click/tap pins it until a second click, `Escape` or a press outside.
 */
export function Tooltip({ label, content, children, align = "center", ...button }: Props) {
  const [open, setOpen] = useState<"hover" | "pinned" | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        {...button}
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => (o === "pinned" ? null : "pinned"))}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen((o) => o ?? "hover")}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((o) => (o === "hover" ? null : o))}
      >
        {children}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute top-full z-10 mt-1 w-max max-w-60 rounded border border-line bg-surface px-2 py-1 text-left text-xs font-normal whitespace-normal text-fg normal-case shadow-sm ${alignClass[align]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
