import { Inject, Injectable } from "@nestjs/common";
import {
  availableActions,
  characterIds,
  matchingCards,
  reachableFor,
  weaponIds,
  type Game,
  type Location,
  type PlayerId,
  type PlayState,
  type Triple,
} from "@mystery-game/game";
import type {
  PrivateGameState,
  PublicGameState,
  RoomSummary,
} from "@mystery-game/contracts";
import { PresenceRegistry } from "../../presence/index.js";

export const EVENT_WINDOW = 50;

const copyTriple = (t: Triple): Triple => ({ suspect: t.suspect, weapon: t.weapon, room: t.room });

const copyLocation = (l: Location): PublicGameState["pawns"][number]["location"] =>
  l.kind === "room"
    ? { kind: "room", roomId: l.roomId }
    : { kind: "cell", position: { row: l.position.row, col: l.position.col } };

/**
 * The single place that decides visibility. Public state never contains the
 * envelope (unless FINISHED), any hand, or any revealed card id.
 */
@Injectable()
export class GameProjector {
  public constructor(@Inject(PresenceRegistry) private readonly presence: PresenceRegistry) {}

  public room(game: Game): RoomSummary {
    const last = game.lastResult;
    return {
      id: game.id,
      code: game.roomCode,
      hostId: game.hostId,
      maxPlayers: game.maxPlayers,
      phase: game.phase,
      players: game.players.map((p) => ({
        id: p.id,
        name: p.name,
        ...(p.characterId !== undefined ? { characterId: p.characterId } : {}),
        presence: this.presence.status(game.roomCode, p.id),
      })),
      lastResult: last
        ? {
            winnerId: last.winnerId,
            winnerName: last.winnerName,
            reason: last.reason,
            envelope: copyTriple(last.envelope),
          }
        : null,
    };
  }

  public publicState(game: Game): PublicGameState | null {
    const play = game.play;
    if (!play || game.phase === "LOBBY") return null;
    const finished = game.phase === "FINISHED";
    const { turn } = play;
    const firstSeq = Math.max(0, play.events.length - EVENT_WINDOW);
    return {
      gameId: game.id,
      status: finished ? "FINISHED" : "IN_PROGRESS",
      players: play.turnOrder.map((id) => {
        const player = game.players.find((p) => p.id === id);
        return {
          id,
          name: player?.name ?? "",
          characterId: player?.characterId ?? "red",
          cardCount: play.hands[id]?.length ?? 0,
          eliminated: play.eliminated.includes(id),
          presence: this.presence.status(game.roomCode, id),
        };
      }),
      turnOrder: [...play.turnOrder],
      turn: {
        playerId: turn.playerId,
        dice: turn.dice ? [turn.dice[0], turn.dice[1]] : null,
        hasMoved: turn.hasMoved,
        pendingSuggestion: turn.pendingSuggestion
          ? {
              suggesterId: turn.pendingSuggestion.suggesterId,
              suggestion: copyTriple(turn.pendingSuggestion.suggestion),
              disproverId: turn.pendingSuggestion.disproverId,
            }
          : null,
      },
      pawns: characterIds.map((characterId) => ({
        characterId,
        location: copyLocation(play.pawns[characterId]),
      })),
      weapons: weaponIds.map((weaponId) => ({ weaponId, roomId: play.weapons[weaponId] })),
      events: play.events.slice(firstSeq).map((event, i) => ({
        seq: firstSeq + i,
        // Domain events are public by construction (no card ids); deep-copied via JSON.
        event: JSON.parse(JSON.stringify(event)) as PublicGameState["events"][number]["event"],
      })),
      winner: play.winner ? { playerId: play.winner.playerId, reason: play.winner.reason } : null,
      envelope: finished ? copyTriple(play.envelope) : null,
    };
  }

  public privateState(game: Game, playerId: PlayerId): PrivateGameState | null {
    const play = game.play;
    if (!play || game.phase === "LOBBY") return null;
    const hand = [...(play.hands[playerId] ?? [])];
    const pending = play.turn.pendingSuggestion;
    return {
      gameId: game.id,
      playerId,
      hand,
      availableActions: [...availableActions(game, playerId)],
      reachable: reachableFor(game, playerId).map(copyLocation),
      disproveRequest:
        pending && pending.disproverId === playerId
          ? {
              suggesterId: pending.suggesterId,
              suggestion: copyTriple(pending.suggestion),
              matchingCards: matchingCards(hand, pending.suggestion),
            }
          : null,
      seenCards: play.reveals
        .filter((r) => r.toPlayerId === playerId)
        .map((r) => ({ cardId: r.cardId, fromPlayerId: r.fromPlayerId })),
      envelope: this.isEliminated(play, playerId) ? copyTriple(play.envelope) : null,
    };
  }

  private isEliminated(play: PlayState, playerId: PlayerId): boolean {
    return play.eliminated.includes(playerId);
  }
}
