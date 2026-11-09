import { dealCards } from "./cards.js";
import {
  BOARD,
  CHARACTER_STARTS,
  ROOM_DOORS,
  SECRET_PASSAGES,
  reachableCells,
  roomAt,
} from "./board.js";
import { roomIds, weaponIds } from "./types.js";
import type {
  BoardPosition,
  CardId,
  CharacterId,
  CharacterToken,
  Envelope,
  Game,
  InProgressGame,
  PlayerId,
  Rng,
  RoomId,
  Suggestion,
  WeaponId,
  WeaponToken,
} from "./types.js";

export type TurnActionResult =
  | { readonly ok: true; readonly game: InProgressGame }
  | { readonly ok: false; readonly reason: string };

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
 * Transitions a LOBBY game to IN_PROGRESS.
 * Places characters on their starting cells, distributes weapons across rooms,
 * deals cards, and initialises the first turn.
 */
export function startGame(
  game: Game,
  playerOrder: readonly PlayerId[],
  rng: Rng,
): InProgressGame {
  const { envelope, hands } = dealCards(playerOrder, rng);

  const characterTokens: CharacterToken[] = game.players
    .filter(
      (p): p is typeof p & { characterId: CharacterId } =>
        p.characterId !== undefined,
    )
    .map((p) => ({
      characterId: p.characterId,
      position: CHARACTER_STARTS[p.characterId]!,
    }));

  const shuffledRooms = shuffle(roomIds, rng);
  const weaponTokens: WeaponToken[] = weaponIds.map((weaponId, i) => ({
    weaponId,
    roomId: shuffledRooms[i % shuffledRooms.length]!,
  }));

  const firstPlayer = playerOrder[0]!;

  return {
    ...game,
    phase: "IN_PROGRESS",
    turn: { playerId: firstPlayer, phase: "ROLL" },
    turnOrder: playerOrder,
    characterTokens,
    weaponTokens,
    envelope,
    eliminatedPlayers: [],
    playerHands: hands,
  };
}

/** Rolls two dice (d6 each), advances phase to MOVE. */
export function rollDice(
  game: InProgressGame,
  playerId: PlayerId,
  rng: Rng,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "ROLL") return err("WRONG_PHASE");

  const d1 = (Math.floor(rng() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  const d2 = (Math.floor(rng() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;

  return ok({
    ...game,
    turn: {
      ...game.turn,
      phase: "MOVE",
      diceRoll: [d1, d2] as const,
      remainingMoves: d1 + d2,
    },
  });
}

/** Moves the active player's character to `to` if reachable. */
export function moveCharacter(
  game: InProgressGame,
  playerId: PlayerId,
  to: BoardPosition,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "MOVE") return err("WRONG_PHASE");

  const player = game.players.find((p) => p.id === playerId);
  if (!player?.characterId) return err("NO_CHARACTER");

  const token = game.characterTokens.find(
    (t) => t.characterId === player.characterId,
  );
  if (!token) return err("NO_TOKEN");

  const steps = game.turn.remainingMoves ?? 0;
  if (steps <= 0) return err("NO_MOVES_LEFT");

  const others = game.characterTokens
    .filter((t) => t.characterId !== player.characterId)
    .map((t) => t.position);

  const reachable = reachableCells(token.position, steps, BOARD, others);
  const isReachable = reachable.some(
    (p) => p.row === to.row && p.col === to.col,
  );
  if (!isReachable) return err("UNREACHABLE_CELL");

  const destType = BOARD[to.row]![to.col]!.type;
  const entersRoom = destType === "door" || destType === "room";

  return ok({
    ...game,
    characterTokens: game.characterTokens.map((t) =>
      t.characterId === player.characterId ? { ...t, position: to } : t,
    ),
    turn: {
      ...game.turn,
      phase: entersRoom ? "ACTION" : "DONE",
      remainingMoves: 0,
    },
  });
}

/**
 * Uses the secret passage from the current room to its paired room.
 * Valid only during ACTION phase while in a passage room.
 * Phase stays ACTION so the player may still suggest/accuse/end.
 */
export function useSecretPassage(
  game: InProgressGame,
  playerId: PlayerId,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "ACTION") return err("WRONG_PHASE");

  const player = game.players.find((p) => p.id === playerId);
  if (!player?.characterId) return err("NO_CHARACTER");

  const token = game.characterTokens.find(
    (t) => t.characterId === player.characterId,
  );
  if (!token) return err("NO_TOKEN");

  const currentRoom = roomAt(token.position, BOARD);
  if (!currentRoom) return err("NOT_IN_ROOM");

  const destination = SECRET_PASSAGES[currentRoom];
  if (!destination) return err("NO_SECRET_PASSAGE");

  const destDoors = ROOM_DOORS[destination];
  if (!destDoors || destDoors.length === 0) return err("DESTINATION_NO_DOOR");

  return ok({
    ...game,
    characterTokens: game.characterTokens.map((t) =>
      t.characterId === player.characterId
        ? { ...t, position: destDoors[0]! }
        : t,
    ),
    turn: { ...game.turn, phase: "ACTION" },
  });
}

/**
 * Makes a suggestion in the current room.
 * Moves the suspect character and the named weapon to this room.
 * Builds the disprove queue (clockwise from suggester, excluding eliminated).
 */
export function makeSuggestion(
  game: InProgressGame,
  playerId: PlayerId,
  suspect: CharacterId,
  weapon: WeaponId,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "ACTION") return err("WRONG_PHASE");

  const player = game.players.find((p) => p.id === playerId);
  if (!player?.characterId) return err("NO_CHARACTER");

  const playerToken = game.characterTokens.find(
    (t) => t.characterId === player.characterId,
  );
  if (!playerToken) return err("NO_TOKEN");

  const room = roomAt(playerToken.position, BOARD);
  if (!room) return err("NOT_IN_ROOM");

  const suggestion: Suggestion = { suspect, weapon, room };

  const destDoors = ROOM_DOORS[room];
  const suspectPosition = destDoors?.[0] ?? playerToken.position;

  const disproveQueue = buildDisproveQueue(game, playerId);

  return ok({
    ...game,
    characterTokens: game.characterTokens.map((t) =>
      t.characterId === suspect ? { ...t, position: suspectPosition } : t,
    ),
    weaponTokens: game.weaponTokens.map((t) =>
      t.weaponId === weapon ? { ...t, roomId: room } : t,
    ),
    turn: {
      ...game.turn,
      phase: "SUGGEST_PENDING_DISPROVE",
      suggestion,
      disproveQueue,
    },
  });
}

function buildDisproveQueue(
  game: InProgressGame,
  suggesterId: PlayerId,
): readonly PlayerId[] {
  const n = game.turnOrder.length;
  const start = game.turnOrder.indexOf(suggesterId);
  const queue: PlayerId[] = [];
  for (let i = 1; i < n; i++) {
    const candidate = game.turnOrder[(start + i) % n]!;
    if (!game.eliminatedPlayers.includes(candidate)) queue.push(candidate);
  }
  return queue;
}

/**
 * Responds to a suggestion.
 * - `cardId` defined: validate the player holds it and it matches; resolves to DONE.
 * - `cardId` undefined: player passes; advance the queue (or resolve to DONE if exhausted).
 */
export function disproveOrPass(
  game: InProgressGame,
  playerId: PlayerId,
  cardId?: CardId,
): TurnActionResult {
  if (game.turn.phase !== "SUGGEST_PENDING_DISPROVE") return err("WRONG_PHASE");

  const queue = game.turn.disproveQueue;
  if (!queue || queue.length === 0) return err("EMPTY_DISPROVE_QUEUE");
  if (queue[0] !== playerId) return err("NOT_YOUR_TURN_TO_DISPROVE");

  if (cardId !== undefined) {
    const hand = game.playerHands.get(playerId) ?? [];
    if (!hand.includes(cardId)) return err("CARD_NOT_IN_HAND");

    const { suggestion } = game.turn;
    if (!suggestion) return err("NO_SUGGESTION");
    if (
      cardId !== suggestion.suspect &&
      cardId !== suggestion.weapon &&
      cardId !== suggestion.room
    )
      return err("CARD_NOT_IN_SUGGESTION");

    return ok({
      ...game,
      turn: {
        ...game.turn,
        phase: "DONE",
        disproveQueue: [],
        lastDisproval: { byPlayerId: playerId, cardId },
      },
    });
  }

  // Player passes
  const remaining = queue.slice(1);
  if (remaining.length === 0) {
    return ok({
      ...game,
      turn: {
        ...game.turn,
        phase: "DONE",
        disproveQueue: [],
        lastDisproval: null,
      },
    });
  }

  return ok({
    ...game,
    turn: { ...game.turn, disproveQueue: remaining },
  });
}

/**
 * Makes a final accusation. Correct → game FINISHED with winner.
 * Incorrect → player is eliminated; if all players are eliminated the game also ends.
 */
export function makeAccusation(
  game: InProgressGame,
  playerId: PlayerId,
  suspect: CharacterId,
  weapon: WeaponId,
  room: RoomId,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "ACTION") return err("WRONG_PHASE");

  const { envelope } = game;
  const correct =
    envelope.suspect === suspect &&
    envelope.weapon === weapon &&
    envelope.room === room;

  if (correct) {
    return ok({
      ...game,
      phase: "FINISHED",
      winner: playerId,
      turn: { ...game.turn, phase: "DONE" },
    });
  }

  const eliminated = [...game.eliminatedPlayers, playerId];
  const anyActive = game.turnOrder.some((id) => !eliminated.includes(id));

  return ok({
    ...game,
    phase: anyActive ? "IN_PROGRESS" : "FINISHED",
    eliminatedPlayers: eliminated,
    turn: { ...game.turn, phase: "DONE" },
  });
}

/**
 * Ends the current player's turn and advances to the next non-eliminated player.
 * Accepted from DONE or ACTION phase (player may skip action and end directly).
 */
export function endTurn(
  game: InProgressGame,
  playerId: PlayerId,
): TurnActionResult {
  if (game.turn.playerId !== playerId) return err("NOT_YOUR_TURN");
  if (game.turn.phase !== "DONE" && game.turn.phase !== "ACTION")
    return err("WRONG_PHASE");
  if (game.phase === "FINISHED") return err("GAME_ALREADY_FINISHED");

  const current = game.turnOrder.indexOf(playerId);
  const n = game.turnOrder.length;
  let nextPlayer: PlayerId | null = null;
  for (let i = 1; i <= n; i++) {
    const candidate = game.turnOrder[(current + i) % n]!;
    if (!game.eliminatedPlayers.includes(candidate)) {
      nextPlayer = candidate;
      break;
    }
  }

  if (!nextPlayer) return err("NO_ACTIVE_PLAYERS");

  return ok({
    ...game,
    turn: { playerId: nextPlayer, phase: "ROLL" },
  });
}

// ── helpers ────────────────────────────────────────────────────────────────

function ok(game: InProgressGame): TurnActionResult {
  return { ok: true, game };
}

function err(reason: string): TurnActionResult {
  return { ok: false, reason };
}

// Re-export for callers that need the envelope type from cards
export type { Envelope };
