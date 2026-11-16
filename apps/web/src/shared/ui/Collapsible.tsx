import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { readFlag, writeFlag } from "../lib/storage.js";

type Props = { id: string; title: string; defaultOpen?: boolean; children: ReactNode };

const storageKey = (id: string) => `ui:collapsed:${id}`;

/** Native <details> section whose open state is remembered per browser under `ui:collapsed:<id>`. */
export function Collapsible({ id, title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(() => {
    const collapsed = readFlag(storageKey(id));
    return collapsed === null ? defaultOpen : !collapsed;
  });

  const change = (next: boolean) => {
    if (next === open) return;
    setOpen(next);
    writeFlag(storageKey(id), !next);
  };

  return (
    <details
      open={open}
      // Opened by the browser itself (e.g. find-in-page): keep React state in sync.
      onToggle={(e) => change(e.currentTarget.open)}
      className="group flex flex-col"
    >
      <summary
        // Persist synchronously on activation (click / Enter / Space) instead of waiting for
        // the asynchronous toggle event, which a quick reload could otherwise outrun.
        onClick={(e) => {
          e.preventDefault();
          change(!open);
        }}
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded font-bold select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 -rotate-90 group-open:rotate-0" />
        <h2 className="m-0 text-base font-bold">{title}</h2>
      </summary>
      <div className="pt-1">{children}</div>
    </details>
  );
}
