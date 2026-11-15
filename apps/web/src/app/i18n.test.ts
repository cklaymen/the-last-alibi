import { describe, expect, it } from "vitest";
import { errorCodes } from "@mystery-game/contracts";
import type { Messages } from "../shared/i18n/index.js";
import { errorMessages } from "../shared/errors/index.js";
import { cardMessages } from "../features/cards/index.js";
import { joinMessages } from "../features/join/i18n.js";
import { lobbyMessages } from "../features/lobby/i18n.js";
import { localeMessages } from "../features/locale/i18n.js";
import { nicknameMessages } from "../features/nickname/i18n.js";
import { notebookMessages } from "../features/notebook/i18n.js";
import { themeMessages } from "../features/theme/i18n.js";
import { appMessages } from "./i18n.js";

const dictionaries: Record<string, Messages<Record<string, string>>> = {
  app: appMessages,
  errors: errorMessages,
  cards: cardMessages,
  join: joinMessages,
  lobby: lobbyMessages,
  locale: localeMessages,
  nickname: nicknameMessages,
  notebook: notebookMessages,
  theme: themeMessages,
};

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("i18n completeness", () => {
  for (const [name, messages] of Object.entries(dictionaries)) {
    it(`${name}: pl has exactly the keys of en, non-empty, same placeholders`, () => {
      const en = messages.en as Record<string, string>;
      const pl = messages.pl as Record<string, string>;
      expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en)) {
        expect(pl[key], `${name}.${key}`).toBeTruthy();
        expect(placeholders(pl[key]!), `${name}.${key}`).toEqual(placeholders(en[key]!));
      }
    });
  }

  it("has a text for every server error code", () => {
    for (const code of errorCodes) expect(errorMessages.en).toHaveProperty(code);
  });
});
