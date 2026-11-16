import { describe, expect, it } from "vitest";
import { attentionFor } from "./selectors.js";
import { makeMe } from "./testFixtures.js";

describe("attentionFor", () => {
  it("is none when I have nothing to do", () => {
    expect(attentionFor(makeMe({ availableActions: [] }), false)).toBe("none");
    expect(attentionFor(makeMe({ availableActions: [] }), true)).toBe("none");
  });

  it("is action when I have something to do", () => {
    expect(attentionFor(makeMe({ availableActions: ["disprove"] }), false)).toBe("action");
  });

  it("is urgent when I have something to do and the timer is running out", () => {
    expect(attentionFor(makeMe({ availableActions: ["roll"] }), true)).toBe("urgent");
  });
});
