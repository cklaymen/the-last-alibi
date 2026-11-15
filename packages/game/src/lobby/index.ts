import { fail, ok, type GameResult } from "../shared/result.js";
import type { CharacterId, Game, GameId, Player, PlayerId, RoomCode } from "../shared/types.js";

export const MAX_PLAYERS = 6;

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
  };
}

/** GAME_NOT_IN_LOBBY | PLAYER_ALREADY_JOINED | GAME_FULL */
export function joinGame(game: Game, player: Player): GameResult {
  if (game.phase !== "LOBBY") return fail("GAME_NOT_IN_LOBBY");
  if (game.players.some((p) => p.id === player.id)) return fail("PLAYER_ALREADY_JOINED");
  if (game.players.length >= game.maxPlayers) return fail("GAME_FULL");
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

/** Host only, FINISHED only → LOBBY with same players/characters, new id, play = null. NOT_HOST | GAME_NOT_FINISHED */
export function restartGame(game: Game, byPlayerId: PlayerId, newId: GameId): GameResult {
  if (byPlayerId !== game.hostId) return fail("NOT_HOST");
  if (game.phase !== "FINISHED") return fail("GAME_NOT_FINISHED");
  return ok({ ...game, id: newId, phase: "LOBBY", play: null });
}
