import { characterIds, roomIds, weaponIds } from "./types.js";
import type {
  CardId,
  CharacterId,
  PlayerId,
  Rng,
  RoomId,
  WeaponId,
} from "./types.js";

export interface Envelope {
  readonly suspect: CharacterId;
  readonly weapon: WeaponId;
  readonly room: RoomId;
}

export interface DealResult {
  readonly envelope: Envelope;
  readonly hands: Map<PlayerId, readonly CardId[]>;
}

/** Returns all 21 cards: 6 suspects + 6 weapons + 9 rooms. */
export function buildDeck(): readonly CardId[] {
  return [...characterIds, ...weaponIds, ...roomIds];
}

function pickRandom<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

/**
 * Picks one suspect, one weapon, and one room for the envelope.
 * Shuffles the remaining 18 cards and deals them as evenly as possible
 * to `players` in round-robin order.
 */
export function dealCards(players: readonly PlayerId[], rng: Rng): DealResult {
  if (players.length < 2) throw new RangeError("need at least 2 players");

  const envelopeSuspect = pickRandom(characterIds, rng);
  const envelopeWeapon = pickRandom(weaponIds, rng);
  const envelopeRoom = pickRandom(roomIds, rng);

  const envelope: Envelope = {
    suspect: envelopeSuspect,
    weapon: envelopeWeapon,
    room: envelopeRoom,
  };

  const remaining: CardId[] = [
    ...characterIds.filter((c) => c !== envelopeSuspect),
    ...weaponIds.filter((w) => w !== envelopeWeapon),
    ...roomIds.filter((r) => r !== envelopeRoom),
  ];

  const shuffled = shuffle(remaining, rng);
  const hands = new Map<PlayerId, CardId[]>(players.map((id) => [id, []]));

  for (let i = 0; i < shuffled.length; i++) {
    const playerId = players[i % players.length]!;
    hands.get(playerId)!.push(shuffled[i]!);
  }

  return {
    envelope,
    hands: new Map(
      [...hands.entries()].map(([id, cards]) => [
        id,
        cards as readonly CardId[],
      ]),
    ),
  };
}
