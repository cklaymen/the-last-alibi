import {
  MAX_ROOM_CARDS,
  accusationPlaces,
  disproveTimeLimits,
  turnTimeLimits,
  type RoomSettings,
} from "../shared/types.js";

const includes = (list: readonly unknown[], v: unknown) => list.includes(v);

/** True if every field holds one of the allowed option values. */
export function isValidSettings(s: RoomSettings): boolean {
  return (
    includes(accusationPlaces, s.accusationPlace) &&
    typeof s.accuseAfterSuggestion === "boolean" &&
    typeof s.suggestAfterStaying === "boolean" &&
    includes(turnTimeLimits, s.turnTimeLimitSec) &&
    includes(disproveTimeLimits, s.disproveTimeLimitSec) &&
    Number.isInteger(s.roomCards) &&
    s.roomCards >= 0 &&
    s.roomCards <= MAX_ROOM_CARDS &&
    typeof s.autoNotes === "boolean"
  );
}
