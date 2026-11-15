import type {
  CharacterId,
  Game,
  GameEvent,
  Location,
  PlayState,
  PlayerId,
} from "./types.js";

export function characterOf(game: Game, playerId: PlayerId): CharacterId | undefined {
  return game.players.find((p) => p.id === playerId)?.characterId;
}

export function playerOfCharacter(game: Game, characterId: CharacterId): PlayerId | undefined {
  const id = game.players.find((p) => p.characterId === characterId)?.id;
  return id !== undefined && game.play?.turnOrder.includes(id) ? id : undefined;
}

export function withPlay(game: Game, play: PlayState): Game {
  return { ...game, play };
}

export function withEvents(play: PlayState, ...events: GameEvent[]): PlayState {
  return { ...play, events: [...play.events, ...events] };
}

export function sameLocation(a: Location, b: Location): boolean {
  if (a.kind === "room") return b.kind === "room" && a.roomId === b.roomId;
  return (
    b.kind === "cell" &&
    a.position.row === b.position.row &&
    a.position.col === b.position.col
  );
}

/** Fresh turn for `playerId`; consumes their summons into `suggestionRoom`. */
export function startTurn(play: PlayState, playerId: PlayerId): PlayState {
  const { [playerId]: summoned, ...summonedTo } = play.summonedTo;
  return {
    ...play,
    summonedTo,
    turn: {
      playerId,
      dice: null,
      hasMoved: false,
      leftRoom: null,
      suggestionRoom: summoned ?? null,
      hasSuggested: false,
      pendingSuggestion: null,
    },
  };
}

/** Next non-eliminated player after `from` in turn order (wrapping). */
export function nextPlayer(play: PlayState, from: PlayerId): PlayerId {
  const order = play.turnOrder;
  const start = order.indexOf(from);
  for (let i = 1; i <= order.length; i++) {
    const candidate = order[(start + i) % order.length] as PlayerId;
    if (!play.eliminated.includes(candidate)) return candidate;
  }
  return from;
}

/** Emits `turn_ended` for `playerId` and starts the next player's turn. */
export function passTurn(play: PlayState, playerId: PlayerId): PlayState {
  const ended = withEvents(play, { type: "turn_ended", playerId });
  return startTurn(ended, nextPlayer(ended, playerId));
}
