import type { LucideIcon } from "lucide-react";
import { primaryButtonClass, secondaryButtonClass } from "../../../shared/ui/ModalDialog.js";
import { CommandError } from "../CommandError.js";
import { useCommand, type Send } from "../useCommand.js";

type NoPayloadEvent = "turn:roll" | "turn:passage" | "turn:end";

type Props = {
  send: Send;
  event: NoPayloadEvent;
  label: string;
  Icon: LucideIcon;
  variant?: "primary" | "secondary";
};

/** A button that sends one payload-less turn command and shows its error. */
export function SimpleAction({ send, event, label, Icon, variant = "primary" }: Props) {
  const { run, busy, error } = useCommand(send);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={variant === "primary" ? primaryButtonClass : secondaryButtonClass}
        disabled={busy}
        onClick={() => void run(event, {})}
      >
        <Icon aria-hidden="true" className="size-5" />
        {label}
      </button>
      <CommandError message={error} />
    </div>
  );
}
