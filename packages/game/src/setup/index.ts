import { SEAT_ORDER, START_POSITIONS } from "../board/layout.js";
import { pick, shuffle } from "../shared/random.js";
import { startTurn } from "../shared/play.js";
import { fail, ok, type GameResult } from "../shared/result.js";
import {
  characterIds,
  roomIds,
  weaponIds,
  type CardId,
  type CharacterId,
  type Envelope,
  type Game,
  type Location,
  type PlayState,
  type PlayerId,
  type Rng,
  type RoomId,
  type WeaponId,
} from "../shared/types.js";

export const MIN_PLAYERS = 2;

/**
 * Host only, LOBBY only, ≥2 players, all with a character
 * (NOT_HOST | GAME_NOT_IN_LOBBY | NOT_ENOUGH_PLAYERS | CHARACTER_REQUIRED).
 * All 6 pawns on START_POSITIONS, weapons in 6 different random rooms,
 * turn order by SEAT_ORDER, envelope + round-robin deal, event game_started.
 */
export function startGame(game: Game, byPlayerId: PlayerId, rng: Rng): GameResult {
  if (byPlayerId !== game.hostId) return fail("NOT_HOST");
  if (game.phase !== "LOBBY") return fail("GAME_NOT_IN_LOBBY");
  if (game.players.length < MIN_PLAYERS) return fail("NOT_ENOUGH_PLAYERS");
  if (game.players.some((p) => !p.characterId)) return fail("CHARACTER_REQUIRED");

  const seat = (c: CharacterId | undefined) => SEAT_ORDER.indexOf(c as CharacterId);
  const turnOrder = [...game.players]
    .sort((a, b) => seat(a.characterId) - seat(b.characterId))
    .map((p) => p.id);

  const pawns = Object.fromEntries(
    characterIds.map((c): [CharacterId, Location] => [
      c,
      { kind: "cell", position: START_POSITIONS[c] },
    ]),
  ) as Record<CharacterId, Location>;

  const envelope: Envelope = {
    suspect: pick(characterIds, rng),
    weapon: pick(weaponIds, rng),
    room: pick(roomIds, rng),
  };

  const weaponRooms = shuffle(roomIds, rng);
  const weapons = Object.fromEntries(
    weaponIds.map((w, i): [WeaponId, RoomId] => [w, weaponRooms[i] as RoomId]),
  ) as Record<WeaponId, RoomId>;

  const hidden = new Set<CardId>([envelope.suspect, envelope.weapon, envelope.room]);
  const deck = shuffle(
    ([...characterIds, ...weaponIds, ...roomIds] as CardId[]).filter((c) => !hidden.has(c)),
    rng,
  );
  const hands: Record<string, CardId[]> = Object.fromEntries(turnOrder.map((id) => [id, []]));
  deck.forEach((card, i) => hands[turnOrder[i % turnOrder.length] as PlayerId]?.push(card));

  const first = turnOrder[0] as PlayerId;
  const play: PlayState = startTurn(
    {
      turnOrder,
      turn: {
        playerId: first,
        dice: null,
        hasMoved: false,
        leftRoom: null,
        suggestionRoom: null,
        hasSuggested: false,
        pendingSuggestion: null,
      },
      pawns,
      weapons,
      envelope,
      hands,
      eliminated: [],
      summonedTo: {},
      reveals: [],
      events: [{ type: "game_started", firstPlayerId: first }],
      winner: null,
    },
    first,
  );

  return ok({ ...game, phase: "IN_PROGRESS", play });
}
