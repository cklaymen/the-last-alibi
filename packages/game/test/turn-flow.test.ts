import { describe, expect, it } from "vitest";
import {
  availableActions,
  disprove,
  makeAccusation,
  makeSuggestion,
  movePawn,
  playerId,
  rollDice,
  useSecretPassage,
  type Game,
} from "../src/index.js";
import { cell, diceRng, lobbyWith, pid, room, started, unwrap, withState } from "./helpers.js";

const RED = pid("red");
const GREEN = pid("green");
const BLUE = pid("blue");
const base = (): Game =>
  withState(started(["red", "green", "blue"]), {
    hands: { [RED]: ["rope"], [GREEN]: ["hall"], [BLUE]: ["dagger"] },
    envelope: { suspect: "yellow", weapon: "wrench", room: "study" },
  });

describe("availableActions", () => {
  it("start of turn on a corridor cell", () => {
    expect(availableActions(base(), RED)).toEqual(["roll", "accuse", "end_turn"]);
  });

  it("start of turn in a secret-passage room", () => {
    const g = withState(base(), { pawns: { red: room("kitchen") } });
    expect(availableActions(g, RED)).toEqual(["roll", "passage", "accuse", "end_turn"]);
  });

  it("start of turn in a summoned room offers a suggestion", () => {
    const g = withState(base(), { pawns: { red: room("hall") }, turn: { suggestionRoom: "hall" } });
    expect(availableActions(g, RED)).toEqual(["roll", "suggest", "accuse", "end_turn"]);
  });

  it("start of turn in a room without summons: no suggestion", () => {
    const g = withState(base(), { pawns: { red: room("hall") } });
    expect(availableActions(g, RED)).toEqual(["roll", "accuse", "end_turn"]);
  });

  it("after rolling", () => {
    const g = unwrap(rollDice(base(), RED, diceRng(2, 3)));
    expect(availableActions(g, RED)).toEqual(["move", "accuse", "end_turn"]);
  });

  it("after rolling inside a fully blocked room", () => {
    const g = unwrap(
      rollDice(withState(base(), { pawns: { red: room("conservatory"), blue: cell(5, 19) } }), RED, diceRng(6, 6)),
    );
    expect(availableActions(g, RED)).toEqual(["accuse", "end_turn"]);
  });

  it("after moving onto a corridor cell", () => {
    let g = unwrap(rollDice(base(), RED, diceRng(1, 1)));
    g = unwrap(movePawn(g, RED, cell(23, 7)));
    expect(availableActions(g, RED)).toEqual(["accuse", "end_turn"]);
  });

  it("after entering a room", () => {
    let g = unwrap(rollDice(base(), RED, diceRng(6, 6)));
    g = unwrap(movePawn(g, RED, room("lounge")));
    expect(availableActions(g, RED)).toEqual(["suggest", "accuse", "end_turn"]);
  });

  it("after using a secret passage", () => {
    const g = unwrap(useSecretPassage(withState(base(), { pawns: { red: room("kitchen") } }), RED));
    expect(availableActions(g, RED)).toEqual(["suggest", "accuse", "end_turn"]);
  });

  it("while a suggestion is pending and after it is resolved", () => {
    const inHall = withState(base(), { pawns: { red: room("hall") }, turn: { suggestionRoom: "hall" } });
    const g = unwrap(makeSuggestion(inHall, RED, "purple", "rope"));
    expect(availableActions(g, RED)).toEqual([]);
    expect(availableActions(g, GREEN)).toEqual(["disprove"]);
    expect(availableActions(g, BLUE)).toEqual([]);
    const done = unwrap(disprove(g, GREEN, "hall"));
    // summoned suggestion before rolling: per spec rolling stays available
    expect(availableActions(done, RED)).toEqual(["roll", "accuse", "end_turn"]);
    expect(availableActions(done, GREEN)).toEqual([]);
  });

  it("eliminated player can only disprove", () => {
    const inHall = withState(base(), {
      pawns: { red: room("hall") },
      turn: { suggestionRoom: "hall" },
      eliminated: [GREEN],
    });
    expect(availableActions(inHall, GREEN)).toEqual([]);
    const g = unwrap(makeSuggestion(inHall, RED, "purple", "rope"));
    expect(availableActions(g, GREEN)).toEqual(["disprove"]);
  });

  it("an eliminated active player gets nothing", () => {
    const g = unwrap(makeAccusation(base(), RED, { suspect: "red", weapon: "rope", room: "hall" }));
    expect(availableActions(g, RED)).toEqual([]);
    expect(availableActions(g, GREEN)).toEqual(["roll", "accuse", "end_turn"]);
  });

  it("other players, unknown players, lobby and finished games get nothing", () => {
    expect(availableActions(base(), GREEN)).toEqual([]);
    expect(availableActions(base(), playerId("ghost"))).toEqual([]);
    expect(availableActions(lobbyWith(["red", "green"]), RED)).toEqual([]);
    const won = unwrap(makeAccusation(base(), RED, { suspect: "yellow", weapon: "wrench", room: "study" }));
    expect(availableActions(won, RED)).toEqual([]);
    expect(availableActions(won, GREEN)).toEqual([]);
  });
});
