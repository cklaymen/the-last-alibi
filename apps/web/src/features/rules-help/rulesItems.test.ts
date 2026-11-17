import { describe, expect, it } from "vitest";
import type { RoomSettings } from "@mystery-game/contracts";
import { rulesItems } from "./rulesItems.js";

const defaults: RoomSettings = {
  accusationPlace: "any_room",
  accuseAfterSuggestion: true,
  suggestAfterStaying: false,
  turnTimeLimitSec: 90,
  disproveTimeLimitSec: 30,
  roomCards: 0,
  autoNotes: true,
};
const optional = (s: RoomSettings | null) => rulesItems(s).filter((i) => i.optional);

describe("rulesItems", () => {
  it("null settings → base rules + one host note", () => {
    expect(optional(null).map((i) => i.key)).toEqual(["hostNote"]);
    expect(rulesItems(null).filter((i) => !i.optional)).toHaveLength(5);
  });

  it("defaults → one optional line per setting except disabled ones", () => {
    expect(optional(defaults).map((i) => i.key)).toEqual([
      "place_any_room",
      "accuseAfterSuggestion_on",
      "turnLimit",
      "disproveLimit",
      "autoNotes_on",
    ]);
  });

  it("values are reflected", () => {
    const items = optional({
      ...defaults,
      turnTimeLimitSec: 30,
      disproveTimeLimitSec: null,
      accusationPlace: "named_room",
      accuseAfterSuggestion: false,
      suggestAfterStaying: true,
      roomCards: 4,
      autoNotes: false,
    });
    expect(items).toEqual([
      { key: "place_named_room", optional: true },
      { key: "accuseAfterSuggestion_off", optional: true },
      { key: "suggestAfterStaying", optional: true },
      { key: "turnLimit", params: { n: 30 }, optional: true },
      { key: "disproveLimit_none", optional: true },
      { key: "roomCards", params: { n: 4 }, optional: true },
      { key: "autoNotes_off", optional: true },
    ]);
  });

  it("base items are never optional", () => {
    expect(rulesItems(defaults).slice(0, 5).every((i) => !i.optional)).toBe(true);
  });
});
