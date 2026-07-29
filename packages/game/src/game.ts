import type {
  CharacterId,
  Game,
  GameId,
  JoinGameResult,
  LobbyActionResult,
  Player,
  PlayerId,
  RoomCode,
} from "./types.js";

const minimumPlayers = 3;
const maximumPlayers = 6;

export function createGame(
  gameId: GameId,
  roomCode: RoomCode,
  host: Player,
  maxPlayers = maximumPlayers,
): Game {
  if (maxPlayers < minimumPlayers || maxPlayers > maximumPlayers) {
    throw new RangeError(
      `maxPlayers must be between ${minimumPlayers} and ${maximumPlayers}`,
    );
  }

  return {
    id: gameId,
    roomCode,
    hostId: host.id,
    maxPlayers,
    phase: "LOBBY",
    players: [host],
  };
}

export function joinGame(game: Game, player: Player): JoinGameResult {
  if (game.players.some((currentPlayer) => currentPlayer.id === player.id)) {
    return { ok: false, reason: "PLAYER_ALREADY_JOINED" };
  }

  if (game.players.length >= game.maxPlayers) {
    return { ok: false, reason: "GAME_FULL" };
  }

  return {
    ok: true,
    game: {
      ...game,
      players: [...game.players, player],
    },
  };
}

export function chooseCharacter(
  game: Game,
  playerId: PlayerId,
  characterId: CharacterId,
): LobbyActionResult {
  if (!game.players.some((player) => player.id === playerId)) {
    return { ok: false, reason: "PLAYER_NOT_FOUND" };
  }

  if (
    game.players.some(
      (player) => player.id !== playerId && player.characterId === characterId,
    )
  ) {
    return { ok: false, reason: "CHARACTER_TAKEN" };
  }

  return updatePlayer(game, playerId, (player) => ({
    ...player,
    characterId,
    isReady: false,
  }));
}

export function setPlayerReady(
  game: Game,
  playerId: PlayerId,
  isReady: boolean,
): LobbyActionResult {
  const player = game.players.find(
    (currentPlayer) => currentPlayer.id === playerId,
  );

  if (!player) {
    return { ok: false, reason: "PLAYER_NOT_FOUND" };
  }

  if (isReady && !player.characterId) {
    return { ok: false, reason: "GAME_NOT_READY" };
  }

  return updatePlayer(game, playerId, (currentPlayer) => ({
    ...currentPlayer,
    isReady,
  }));
}

function updatePlayer(
  game: Game,
  playerId: PlayerId,
  update: (player: Player) => Player,
): LobbyActionResult {
  return {
    ok: true,
    game: {
      ...game,
      players: game.players.map((player) =>
        player.id === playerId ? update(player) : player,
      ),
    },
  };
}

export function gameId(value: string): GameId {
  return value as GameId;
}

export function playerId(value: string): PlayerId {
  return value as PlayerId;
}

export function roomCode(value: string): RoomCode {
  return value as RoomCode;
}
