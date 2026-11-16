import { accusationError } from "../accusation/index.js";
import { passageTarget, reachableFor, rollError } from "../movement/index.js";
import { requireActivePlayer } from "../shared/guards.js";
import { passTurn, withPlay } from "../shared/play.js";
import { fail, ok, type GameResult } from "../shared/result.js";
import type { ActionId, Game, PlayerId } from "../shared/types.js";
import { isDisprover, suggestionRoomFor } from "../suggestion/index.js";

export function endTurn(game: Game, playerId: PlayerId): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  return ok(withPlay(game, passTurn(g.value.play, playerId)));
}

/** The only source of allowed actions for the UI. */
export function availableActions(game: Game, playerId: PlayerId): ActionId[] {
  if (isDisprover(game, playerId)) return ["disprove"];
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return [];
  const ctx = g.value;
  const actions: ActionId[] = [];
  if (!rollError(ctx)) actions.push("roll");
  if (!("code" in passageTarget(ctx))) actions.push("passage");
  if (reachableFor(game, playerId).length > 0) actions.push("move");
  if (!("code" in suggestionRoomFor(ctx))) actions.push("suggest");
  if (accusationError(ctx) === null) actions.push("accuse");
  actions.push("end_turn");
  return actions;
}
