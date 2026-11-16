import type { PrivateGameState } from "@mystery-game/contracts";

/** How strongly the action section asks for the player's attention. */
export type Attention = "none" | "action" | "urgent";

/** `none` without available actions; `urgent` when the decision timer is running out; else `action`. */
export function attentionFor(me: PrivateGameState, timerUrgent: boolean): Attention {
  if (me.availableActions.length === 0) return "none";
  return timerUrgent ? "urgent" : "action";
}
