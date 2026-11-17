import type { RoomSettings } from "@mystery-game/contracts";
import type { rulesHelpMessages } from "./i18n.js";

export type RulesKey = keyof (typeof rulesHelpMessages)["en"];
export type RulesItem = { key: RulesKey; params?: Record<string, string | number>; optional: boolean };

const base: RulesKey[] = ["goal", "turn", "suggest", "disprove", "accuse"];

/** Lines of the rules summary: the fixed rules, then one line per room setting (or a host note outside a room). */
export function rulesItems(settings: RoomSettings | null): RulesItem[] {
  const items: RulesItem[] = base.map((key) => ({ key, optional: false }));
  const opt = (key: RulesKey, params?: RulesItem["params"]) =>
    items.push(params ? { key, params, optional: true } : { key, optional: true });
  if (!settings) {
    opt("hostNote");
    return items;
  }
  opt(`place_${settings.accusationPlace}`);
  opt(settings.accuseAfterSuggestion ? "accuseAfterSuggestion_on" : "accuseAfterSuggestion_off");
  if (settings.suggestAfterStaying) opt("suggestAfterStaying");
  if (settings.turnTimeLimitSec === null) opt("turnLimit_none");
  else opt("turnLimit", { n: settings.turnTimeLimitSec });
  if (settings.disproveTimeLimitSec === null) opt("disproveLimit_none");
  else opt("disproveLimit", { n: settings.disproveTimeLimitSec });
  if (settings.roomCards > 0) opt("roomCards", { n: settings.roomCards });
  opt(settings.autoNotes ? "autoNotes_on" : "autoNotes_off");
  return items;
}
