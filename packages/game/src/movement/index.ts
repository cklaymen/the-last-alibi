import { SECRET_PASSAGES } from "../board/layout.js";
import { requireActivePlayer, type TurnContext } from "../shared/guards.js";
import { sameLocation, withEvents, withPlay } from "../shared/play.js";
import { randomInt } from "../shared/random.js";
import { fail, ok, type GameErrorCode, type GameResult } from "../shared/result.js";
import type { Game, Location, PlayerId, Rng, RoomId } from "../shared/types.js";
import { reachableLocations } from "./reachable.js";

export { reachableLocations } from "./reachable.js";

/**
 * Command-specific guard for rolling (after the common guards).
 * A suggestion replaces movement, so nothing can be rolled after one.
 */
export function rollError(ctx: TurnContext): GameErrorCode | null {
  if (ctx.turn.dice) return "ALREADY_ROLLED";
  if (ctx.turn.hasMoved) return "ALREADY_MOVED";
  if (ctx.turn.hasSuggested) return "ALREADY_SUGGESTED";
  return null;
}

/** Command-specific guard for the secret passage; returns the target room. */
export function passageTarget(ctx: TurnContext): { code: GameErrorCode } | { to: RoomId; from: RoomId } {
  const err = rollError(ctx);
  if (err) return { code: err };
  const from = ctx.location.kind === "room" ? ctx.location.roomId : null;
  const to = from ? SECRET_PASSAGES[from] : undefined;
  if (!from || !to) return { code: "NO_SECRET_PASSAGE" };
  return { from, to };
}

function reachableIn(ctx: TurnContext): Location[] {
  const { turn, play } = ctx;
  if (!turn.dice || turn.hasMoved || turn.hasSuggested) return [];
  return reachableLocations(play.pawns, ctx.character, turn.dice[0] + turn.dice[1], turn.leftRoom);
}

export function rollDice(game: Game, playerId: PlayerId, rng: Rng): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  const err = rollError(g.value);
  if (err) return fail(err);
  const dice: readonly [number, number] = [randomInt(rng, 6) + 1, randomInt(rng, 6) + 1];
  const play = g.value.play;
  return ok(
    withPlay(game, withEvents({ ...play, turn: { ...play.turn, dice } }, { type: "rolled", playerId, dice })),
  );
}

export function movePawn(game: Game, playerId: PlayerId, to: Location): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  const ctx = g.value;
  if (!ctx.turn.dice) return fail("NOT_ROLLED");
  if (ctx.turn.hasMoved) return fail("ALREADY_MOVED");
  if (ctx.turn.hasSuggested) return fail("ALREADY_SUGGESTED");
  const target = reachableIn(ctx).find((l) => sameLocation(l, to));
  if (!target) return fail("UNREACHABLE");
  const { play, turn, location } = ctx;
  return ok(
    withPlay(
      game,
      withEvents(
        {
          ...play,
          pawns: { ...play.pawns, [ctx.character]: target },
          turn: {
            ...turn,
            hasMoved: true,
            leftRoom: location.kind === "room" ? location.roomId : turn.leftRoom,
            suggestionRoom: target.kind === "room" ? target.roomId : null,
          },
        },
        { type: "moved", playerId, to: target },
      ),
    ),
  );
}

export function useSecretPassage(game: Game, playerId: PlayerId): GameResult {
  const g = requireActivePlayer(game, playerId);
  if (!g.ok) return fail(g.code);
  const target = passageTarget(g.value);
  if ("code" in target) return fail(target.code);
  const { play, turn } = g.value;
  return ok(
    withPlay(
      game,
      withEvents(
        {
          ...play,
          pawns: { ...play.pawns, [g.value.character]: { kind: "room", roomId: target.to } },
          turn: { ...turn, hasMoved: true, leftRoom: target.from, suggestionRoom: target.to },
        },
        { type: "passage_used", playerId, from: target.from, to: target.to },
      ),
    ),
  );
}

/** Destinations for the current roll; [] when not allowed to move. */
export function reachableFor(game: Game, playerId: PlayerId): Location[] {
  const g = requireActivePlayer(game, playerId);
  return g.ok ? reachableIn(g.value) : [];
}
