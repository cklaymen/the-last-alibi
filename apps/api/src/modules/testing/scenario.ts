import type { Scenario } from "@mystery-game/contracts";
import type { CardId, Game, PlayerId, RoomId } from "@mystery-game/game";
import { AppError } from "../../shared/app-error.js";

/** Applies a test scenario to a started game (players referenced by name). Pure. */
export function applyScenario(game: Game, scenario: Scenario): Game {
  const play = game.play;
  if (!play) throw new AppError("GAME_NOT_IN_PROGRESS");

  const idOf = (name: string): PlayerId => {
    const player = game.players.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (!player) throw new AppError("INVALID_PAYLOAD");
    return player.id;
  };
  const byId = <T>(record: Record<string, T> | undefined): Record<string, T> =>
    Object.fromEntries(Object.entries(record ?? {}).map(([name, v]) => [idOf(name), v]));

  const hands: Record<string, readonly CardId[]> = { ...play.hands, ...byId(scenario.hands) };
  const summonedTo: Record<string, RoomId> = { ...play.summonedTo, ...byId(scenario.summonedTo) };
  const active = scenario.activePlayer !== undefined ? idOf(scenario.activePlayer) : undefined;

  return {
    ...game,
    play: {
      ...play,
      envelope: scenario.envelope ?? play.envelope,
      hands,
      summonedTo,
      pawns: { ...play.pawns, ...scenario.pawns },
      weapons: { ...play.weapons, ...scenario.weapons },
      turn: active
        ? {
            playerId: active,
            dice: null,
            hasMoved: false,
            leftRoom: null,
            suggestionRoom: summonedTo[active] ?? null,
            hasSuggested: false,
            pendingSuggestion: null,
          }
        : play.turn,
    },
  };
}
