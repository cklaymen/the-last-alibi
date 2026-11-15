import type { PublicGameState } from "@mystery-game/contracts";

export type GamePlayer = PublicGameState["players"][number];

export function playerById(game: PublicGameState, id: string): GamePlayer | undefined {
  return game.players.find((p) => p.id === id);
}

/** Display name of a player; falls back to the id for unknown players. */
export function playerName(game: PublicGameState, id: string): string {
  return playerById(game, id)?.name ?? id;
}

export function myPlayer(game: PublicGameState, myId: string): GamePlayer | undefined {
  return playerById(game, myId);
}

/** Players in turn order (players missing from turnOrder are appended). */
export function orderedPlayers(game: PublicGameState): GamePlayer[] {
  const ordered = game.turnOrder
    .map((id) => playerById(game, id))
    .filter((p): p is GamePlayer => p !== undefined);
  const rest = game.players.filter((p) => !game.turnOrder.includes(p.id));
  return [...ordered, ...rest];
}

export function isMyTurn(game: PublicGameState, myId: string): boolean {
  return game.status === "IN_PROGRESS" && game.turn.playerId === myId;
}

export function isEliminated(game: PublicGameState, id: string): boolean {
  return playerById(game, id)?.eliminated ?? false;
}

/** Plural category used by the card-count texts (Polish needs one/few/many). */
export function pluralCategory(n: number, locale: "en" | "pl"): "one" | "few" | "many" {
  if (n === 1) return "one";
  if (locale === "en") return "many";
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "few" : "many";
}
