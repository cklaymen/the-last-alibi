import { fail, ok, type GameResult } from "../shared/result.js";
import type { CharacterId, Game, GameId, Player, PlayerId, RoomCode } from "../shared/types.js";

export const MAX_PLAYERS = 6;

const normalize = (name: string) => name.trim().toLocaleLowerCase();

/** True if another player in the room already uses `name` (case-insensitive, trimmed). */
export function isNameTaken(game: Game, name: string, exceptId?: PlayerId): boolean {
  return game.players.some((p) => p.id !== exceptId && normalize(p.name) === normalize(name));
}

/** New room in LOBBY with the host as the only player (max 6 players). */
export function createGame(id: GameId, code: RoomCode, host: Player): Game {
  return {
    id,
    roomCode: code,
    hostId: host.id,
    maxPlayers: MAX_PLAYERS,
    phase: "LOBBY",
    players: [host],
    play: null,
    lastResult: null,
  };
}

/** GAME_NOT_IN_LOBBY | PLAYER_ALREADY_JOINED | GAME_FULL | NAME_TAKEN */
export function joinGame(game: Game, player: Player): GameResult {
  if (game.phase !== "LOBBY") return fail("GAME_NOT_IN_LOBBY");
  if (game.players.some((p) => p.id === player.id)) return fail("PLAYER_ALREADY_JOINED");
  if (game.players.length >= game.maxPlayers) return fail("GAME_FULL");
  if (isNameTaken(game, player.name)) return fail("NAME_TAKEN");
  return ok({ ...game, players: [...game.players, player] });
}

/** GAME_NOT_IN_LOBBY | PLAYER_NOT_FOUND | CHARACTER_TAKEN */
export function chooseCharacter(game: Game, playerId: PlayerId, characterId: CharacterId): GameResult {
  if (game.phase !== "LOBBY") return fail("GAME_NOT_IN_LOBBY");
  if (!game.players.some((p) => p.id === playerId)) return fail("PLAYER_NOT_FOUND");
  if (game.players.some((p) => p.id !== playerId && p.characterId === characterId))
    return fail("CHARACTER_TAKEN");
  return ok({
    ...game,
    players: game.players.map((p) => (p.id === playerId ? { ...p, characterId } : p)),
  });
}

/** Any phase. PLAYER_NOT_FOUND | NAME_TAKEN (another player in the room has it). */
export function renamePlayer(game: Game, playerId: PlayerId, name: string): GameResult {
  if (!game.players.some((p) => p.id === playerId)) return fail("PLAYER_NOT_FOUND");
  const trimmed = name.trim();
  if (isNameTaken(game, trimmed, playerId)) return fail("NAME_TAKEN");
  return ok({
    ...game,
    players: game.players.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p)),
  });
}

/**
 * Removes a player from the LOBBY (left or kicked). If the host leaves, the
 * longest-present remaining player becomes host. The room may become empty.
 * GAME_NOT_IN_LOBBY | PLAYER_NOT_FOUND
 */
export function removePlayer(game: Game, playerId: PlayerId): GameResult {
  if (game.phase !== "LOBBY") return fail("GAME_NOT_IN_LOBBY");
  if (!game.players.some((p) => p.id === playerId)) return fail("PLAYER_NOT_FOUND");
  const players = game.players.filter((p) => p.id !== playerId);
  const hostId =
    game.hostId === playerId ? (players[0]?.id ?? game.hostId) : game.hostId;
  return ok({ ...game, players, hostId });
}

/** Host removes another player before the game starts. NOT_HOST | CANNOT_KICK_SELF | GAME_NOT_IN_LOBBY | PLAYER_NOT_FOUND */
export function kickPlayer(game: Game, byPlayerId: PlayerId, targetId: PlayerId): GameResult {
  if (byPlayerId !== game.hostId) return fail("NOT_HOST");
  if (byPlayerId === targetId) return fail("CANNOT_KICK_SELF");
  return removePlayer(game, targetId);
}

/**
 * A FINISHED game goes straight back to the LOBBY of the same room: same
 * players and characters, new game id, `lastResult` keeps winner + envelope.
 * GAME_NOT_FINISHED
 */
export function returnToLobby(game: Game, newId: GameId): GameResult {
  if (game.phase !== "FINISHED" || !game.play?.winner) return fail("GAME_NOT_FINISHED");
  const { winner, envelope } = game.play;
  return ok({
    ...game,
    id: newId,
    phase: "LOBBY",
    play: null,
    lastResult: {
      winnerId: winner.playerId,
      winnerName: game.players.find((p) => p.id === winner.playerId)?.name ?? "",
      reason: winner.reason,
      envelope,
    },
  });
}
