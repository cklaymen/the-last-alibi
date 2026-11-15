import {
  chooseCharacter,
  createGame,
  gameId,
  joinGame,
  playerId,
  roomCode,
  startGame,
  type CharacterId,
  type Game,
  type GameResult,
  type Location,
  type PlayState,
  type PlayerId,
  type Position,
  type RoomId,
  type Rng,
  type Turn,
} from "../src/index.js";

export const pid = (c: CharacterId): PlayerId => playerId(`p_${c}`);

/** Cycles through `values` forever. */
export function seqRng(values: readonly number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length] as number;
}
export const constRng = (v = 0): Rng => () => v;
/** rng producing the given die faces (1..6). */
export const diceRng = (a: number, b: number): Rng => seqRng([(a - 1) / 6 + 0.01, (b - 1) / 6 + 0.01]);

export function unwrap(r: GameResult): Game {
  if (!r.ok) throw new Error(`expected ok, got ${r.code}`);
  return r.game;
}
export function codeOf(r: GameResult): string {
  return r.ok ? "OK" : r.code;
}

/** Lobby whose host is the first character; players join in the given order. */
export function lobbyWith(chars: readonly CharacterId[]): Game {
  const [first, ...rest] = chars as [CharacterId, ...CharacterId[]];
  let game = createGame(gameId("g1"), roomCode("ABCD"), { id: pid(first), name: first });
  for (const c of rest) game = unwrap(joinGame(game, { id: pid(c), name: c }));
  for (const c of chars) game = unwrap(chooseCharacter(game, pid(c), c));
  return game;
}

export function started(chars: readonly CharacterId[], rng: Rng = constRng(0)): Game {
  const game = lobbyWith(chars);
  return unwrap(startGame(game, game.hostId, rng));
}

export function play(game: Game): PlayState {
  if (!game.play) throw new Error("no play state");
  return game.play;
}

export interface PlayOverrides extends Partial<Omit<PlayState, "pawns" | "turn">> {
  readonly pawns?: Partial<Record<CharacterId, Location>>;
  readonly turn?: Partial<Turn>;
}

/** Targeted override of play state (pawns/turn are merged). */
export function withState(game: Game, o: PlayOverrides): Game {
  const p = play(game);
  const { pawns, turn, ...rest } = o;
  return {
    ...game,
    play: {
      ...p,
      ...rest,
      pawns: { ...p.pawns, ...pawns } as PlayState["pawns"],
      turn: { ...p.turn, ...turn },
    },
  };
}

export const cell = (row: number, col: number): Location => ({ kind: "cell", position: { row, col } });
export const room = (roomId: RoomId): Location => ({ kind: "room", roomId });
export const pos = (row: number, col: number): Position => ({ row, col });
