import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

/** Compact game buttons (the shared `Button` is sized for the join screen). */
export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded bg-brand-strong px-4 py-2 font-bold text-on-brand disabled:cursor-not-allowed disabled:bg-disabled disabled:text-muted";
export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded border border-line bg-surface px-4 py-2 font-bold text-fg disabled:cursor-not-allowed disabled:opacity-50";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Accessible modal: role=dialog + aria-modal, named by its heading; focus moves
 * inside on open, Tab is trapped, Escape closes and focus returns to the opener.
 */
export function ModalDialog({ title, onClose, children, footer }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] sm:items-center sm:p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="flex max-h-[100dvh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-t-lg border border-line bg-surface p-4 text-fg shadow-lg outline-none sm:max-h-[90dvh] sm:rounded-lg"
      >
        <h2 id={titleId} className="m-0 text-lg font-bold">
          {title}
        </h2>
        {children}
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 bg-surface pt-2">{footer}</div>
      </div>
    </div>
  );
}
