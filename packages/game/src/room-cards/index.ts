import { roomIds, type CardId, type Game, type PlayerId, type RoomId } from "../shared/types.js";

/**
 * Rooms the player's pawn has stood in during this game: rooms entered by a move
 * or a secret passage, rooms the pawn was summoned to by any suggestion naming
 * the player's character, plus the room it stands in now. Deduplicated, in
 * board order.
 */
export function roomsVisitedBy(game: Game, playerId: PlayerId): RoomId[] {
  const play = game.play;
  const characterId = game.players.find((p) => p.id === playerId)?.characterId;
  if (!play || !characterId || !play.turnOrder.includes(playerId)) return [];

  const visited = new Set<RoomId>();
  for (const e of play.events) {
    if (e.type === "moved" && e.playerId === playerId && e.to.kind === "room") visited.add(e.to.roomId);
    else if (e.type === "passage_used" && e.playerId === playerId) visited.add(e.to);
    else if (e.type === "suggested" && e.suggestion.suspect === characterId) visited.add(e.suggestion.room);
  }
  const current = play.pawns[characterId];
  if (current.kind === "room") visited.add(current.roomId);
  return roomIds.filter((r) => visited.has(r));
}

/** Face-down room cards the player may peek at: those in rooms they have stood in. */
export function visibleRoomCards(
  game: Game,
  playerId: PlayerId,
): { roomId: RoomId; cardId: CardId }[] {
  const roomCards = game.play?.roomCards ?? {};
  return roomsVisitedBy(game, playerId).flatMap((roomId) => {
    const cardId = roomCards[roomId];
    return cardId ? [{ roomId, cardId }] : [];
  });
}
