import {
  Armchair,
  BookOpen,
  Cable,
  CircleDot,
  Crosshair,
  Flame,
  Flower2,
  Landmark,
  Lasso,
  Music,
  Sofa,
  Sword,
  Utensils,
  Wine,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  characterIds,
  roomIds,
  weaponIds,
  type CardId,
  type CardKind,
  type CharacterId,
} from "@mystery-game/game";

/**
 * The single place that maps cards to their look. Replace placeholders with
 * final artwork here without touching game code.
 */
export const characterColorVar: Record<CharacterId, string> = {
  red: "var(--pawn-red)",
  yellow: "var(--pawn-yellow)",
  white: "var(--pawn-white)",
  green: "var(--pawn-green)",
  blue: "var(--pawn-blue)",
  purple: "var(--pawn-purple)",
};

export const cardIcon: Record<Exclude<CardId, CharacterId>, LucideIcon> = {
  candlestick: Flame,
  dagger: Sword,
  lead_pipe: Cable,
  revolver: Crosshair,
  rope: Lasso,
  wrench: Wrench,
  kitchen: Utensils,
  ballroom: Music,
  conservatory: Flower2,
  dining_room: Wine,
  billiard_room: CircleDot,
  library: BookOpen,
  lounge: Sofa,
  hall: Landmark,
  study: Armchair,
};

export function cardKind(id: CardId): CardKind {
  if ((characterIds as readonly string[]).includes(id)) return "suspect";
  if ((weaponIds as readonly string[]).includes(id)) return "weapon";
  if ((roomIds as readonly string[]).includes(id)) return "room";
  throw new Error(`Unknown card ${id}`);
}

export const isCharacter = (id: CardId): id is CharacterId =>
  cardKind(id) === "suspect";
