import { Dices, DoorOpen, Hourglass } from "lucide-react";
import { useT } from "../../../shared/i18n/index.js";
import { turnMessages } from "../i18n.js";
import type { ActionProps } from "../types.js";
import { SimpleAction } from "./SimpleAction.js";

export function RollAction({ send }: ActionProps) {
  const t = useT(turnMessages);
  return <SimpleAction send={send} event="turn:roll" label={t("roll")} Icon={Dices} />;
}

export function PassageAction({ send }: ActionProps) {
  const t = useT(turnMessages);
  return <SimpleAction send={send} event="turn:passage" label={t("passage")} Icon={DoorOpen} />;
}

export function EndTurnAction({ send }: ActionProps) {
  const t = useT(turnMessages);
  return (
    <SimpleAction send={send} event="turn:end" label={t("endTurn")} Icon={Hourglass} variant="secondary" />
  );
}
