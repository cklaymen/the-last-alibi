import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { GameEvent } from "@mystery-game/contracts";
import { makeGame } from "../game/testFixtures.js";
import { describeEvent } from "./describe.js";
import { EventLog } from "./EventLog.js";

const triple = { suspect: "red", weapon: "rope", room: "kitchen" } as const;

const cases: [GameEvent, string][] = [
  [{ type: "game_started", firstPlayerId: "p1" }, "The game has started. Alice goes first."],
  [{ type: "rolled", playerId: "p1", dice: [3, 4] }, "Alice rolled 7 (3 + 4)."],
  [{ type: "moved", playerId: "p1", to: { kind: "room", roomId: "kitchen" } }, "Alice entered the Kitchen."],
  [{ type: "moved", playerId: "p1", to: { kind: "cell", position: { row: 1, col: 1 } } }, "Alice moved."],
  [
    { type: "passage_used", playerId: "p2", from: "kitchen", to: "study" },
    "Bob took the secret passage from the Kitchen to the Study.",
  ],
  [{ type: "suggested", playerId: "p1", suggestion: triple }, "Alice suggests Ms. Red with the Rope in the Kitchen."],
  [{ type: "cannot_disprove", playerId: "p2" }, "Bob cannot disprove."],
  [{ type: "card_shown", playerId: "p3", toPlayerId: "p1" }, "Cleo showed a card to Alice."],
  [{ type: "no_one_disproved", suggesterId: "p1" }, "Nobody could disprove."],
  [
    { type: "accused", playerId: "p2", accusation: triple, correct: true },
    "Bob accuses Ms. Red with the Rope in the Kitchen – correct!",
  ],
  [
    { type: "accused", playerId: "p2", accusation: triple, correct: false },
    "Bob accuses Ms. Red with the Rope in the Kitchen – wrong. Bob is out.",
  ],
  [{ type: "turn_ended", playerId: "p1" }, "Alice ended the turn."],
  [{ type: "turn_skipped", playerId: "p2" }, "Bob is away – turn skipped."],
  [{ type: "turn_timed_out", playerId: "p1" }, "Alice's time ran out."],
  [
    { type: "disprove_timed_out", playerId: "p3" },
    "Cleo did not choose in time – a random card was shown.",
  ],
  [{ type: "game_won", playerId: "p3", reason: "LAST_STANDING" }, "Cleo wins!"],
];

describe("EventLog", () => {
  it("renders every event type in EN, newest last", () => {
    const game = makeGame({ events: cases.map(([event], seq) => ({ seq, event })) });
    render(<EventLog game={game} />);
    const items = within(screen.getByRole("region", { name: "Event log" })).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(cases.map(([, text]) => text));
  });

  it("suggested entry shows icons of the three cards", () => {
    const game = makeGame({ events: [{ seq: 0, event: { type: "suggested", playerId: "p1", suggestion: triple } }] });
    render(<EventLog game={game} />);
    const li = within(screen.getByRole("region", { name: "Event log" })).getByRole("listitem");
    const icons = [...li.querySelectorAll("[data-card-icon]")].map((el) => el.getAttribute("data-card-icon"));
    expect(icons).toEqual(["red", "rope", "kitchen"]);
    expect(li).toHaveTextContent("Alice suggests Ms. Red with the Rope in the Kitchen.");
  });

  it("describeEvent resolves names and cards", () => {
    const d = describeEvent(
      { type: "card_shown", playerId: "a", toPlayerId: "b" },
      { name: (id) => id.toUpperCase(), card: (id) => id },
    );
    expect(d).toEqual({ key: "card_shown", params: { name: "A", name2: "B" } });
  });
});
