import { useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, Minus, Plus, RotateCcw } from "lucide-react";
import type { Location, PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import {
  CELLS,
  CENTER_RECT,
  DOORS,
  ROOM_RECTS,
  SECRET_PASSAGES,
  roomIds,
  type CharacterId,
  type RoomId,
  type WeaponId,
} from "@mystery-game/game";
import { cardIcon, cardMessages, characterColorVar } from "../cards/index.js";
import { myPlayer } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL,
  type Point,
  cellBox,
  doorSegment,
  rectBox,
  roomSlot,
  tooltipAnchor,
  viewBoxAttr,
} from "./geometry.js";
import { boardMessages } from "./i18n.js";
import { boardHighlights, locationKey, placePawns, placeWeapons } from "./selectors.js";
import { useBoardView } from "./useBoardView.js";

type Props = {
  game: PublicGameState;
  me: PrivateGameState | null;
  myId: string;
  /** Called when the player picks a highlighted destination. */
  onMove?: (to: Location) => void;
  /** Rendered left of the zoom buttons in the toolbar row (e.g. the players bar). */
  toolbarStart?: ReactNode;
};

/** Board corner each passage room touches, and the arrow towards its partner. */
const PASSAGE_MARKERS: Partial<Record<RoomId, { corner: "tl" | "tr" | "bl" | "br"; Icon: typeof ArrowUpLeft }>> = {
  kitchen: { corner: "tl", Icon: ArrowDownRight },
  conservatory: { corner: "tr", Icon: ArrowDownLeft },
  lounge: { corner: "bl", Icon: ArrowUpRight },
  study: { corner: "br", Icon: ArrowUpLeft },
};

const PAWN_R = 7;
const WEAPON_R = 7;

type Token = { kind: "pawn"; id: CharacterId } | { kind: "weapon"; id: WeaponId };
const sameToken = (a: Token | null, b: Token) => a?.kind === b.kind && a.id === b.id;

export function Board({ game, me, myId, onMove, toolbarStart }: Props) {
  const t = useT(boardMessages);
  const card = useT(cardMessages);
  const { view, svgRef, zoomed, zoomIn, zoomOut, reset, handlers } = useBoardView();
  const myCharacter = myPlayer(game, myId)?.characterId;
  const reachable = onMove ? (me?.reachable ?? []) : [];
  const highlights = boardHighlights(game);
  const [tip, setTip] = useState<{ token: Token; point: Point; text: string; pinned: boolean } | null>(null);

  /** Tap on a pawn/weapon: moves there if its room is reachable, else toggles its tooltip. */
  const tokenHandlers = (token: Token, roomId: RoomId | null, point: Point, text: string) => ({
    onClick: (e: MouseEvent<SVGGElement>) => {
      e.stopPropagation();
      const target = roomId ? reachable.find((l) => l.kind === "room" && l.roomId === roomId) : undefined;
      if (target) {
        setTip(null);
        activate(target);
        return;
      }
      setTip((cur) => (cur?.pinned && sameToken(cur.token, token) ? null : { token, point, text, pinned: true }));
    },
    onPointerEnter: (e: PointerEvent<SVGGElement>) => {
      if (e.pointerType === "mouse") setTip((cur) => (cur?.pinned ? cur : { token, point, text, pinned: false }));
    },
    onPointerLeave: (e: PointerEvent<SVGGElement>) => {
      if (e.pointerType === "mouse") setTip((cur) => (cur && !cur.pinned && sameToken(cur.token, token) ? null : cur));
    },
  });
  const pawnTip = (characterId: CharacterId) => {
    const player = game.players.find((p) => p.characterId === characterId);
    return player ? t("playedBy", { character: card(characterId), player: player.name }) : card(characterId);
  };

  const activate = (to: Location) => onMove?.(to);
  const onKey = (to: Location) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(to);
    }
  };

  const corridorCells = CELLS.flatMap((row, r) =>
    row.flatMap((cell, c) => (cell.kind === "corridor" ? [{ row: r, col: c }] : [])),
  );

  return (
    <section aria-label={t("region")} className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={viewBoxAttr(view)}
        className="block h-auto w-full select-none lg:max-h-[calc(100dvh-6rem)]"
        style={{
          aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
          touchAction: zoomed ? "none" : "pan-y",
        }}
        {...handlers}
        onClick={() => setTip(null)}
      >
        {/* Corridor cells with grid lines */}
        <g aria-hidden="true">
          {corridorCells.map((p) => {
            const b = cellBox(p);
            return (
              <rect
                key={`${p.row}:${p.col}`}
                {...b}
                fill="var(--board-corridor)"
                stroke="var(--board-line)"
                strokeWidth={0.75}
              />
            );
          })}
          {/* Centre block */}
          <rect {...rectBox(CENTER_RECT)} fill="var(--board-void)" stroke="var(--board-line)" strokeWidth={2} />
          {/* Rooms */}
          {roomIds.map((roomId) => (
            <rect
              key={roomId}
              {...rectBox(ROOM_RECTS[roomId])}
              fill="var(--board-room)"
              stroke="var(--board-line)"
              strokeWidth={2}
            />
          ))}
          {/* Doors */}
          {DOORS.map((door) => (
            <line
              key={`${door.inside.row}:${door.inside.col}:${door.outside.row}:${door.outside.col}`}
              {...doorSegment(door)}
              stroke="var(--board-door)"
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
          {/* Secret passages */}
          {roomIds.map((roomId) => {
            const marker = PASSAGE_MARKERS[roomId];
            if (!marker || !SECRET_PASSAGES[roomId]) return null;
            const b = rectBox(ROOM_RECTS[roomId]);
            const x = marker.corner.endsWith("l") ? b.x : b.x + b.width - CELL;
            const y = marker.corner.startsWith("t") ? b.y : b.y + b.height - CELL;
            const { Icon } = marker;
            return (
              <g key={`passage-${roomId}`}>
                <rect x={x + 2} y={y + 2} width={CELL - 4} height={CELL - 4} rx={3} fill="var(--board-door)" />
                <Icon x={x + 4} y={y + 4} width={CELL - 8} height={CELL - 8} color="var(--board-corridor)" strokeWidth={3} aria-hidden="true" />
              </g>
            );
          })}
        </g>

        {/* Reachable destinations */}
        {reachable.map((to) => {
          if (to.kind === "cell") {
            const b = cellBox(to.position);
            return (
              <g
                key={locationKey(to)}
                role="button"
                tabIndex={0}
                aria-label={t("moveToCell", { row: to.position.row + 1, col: to.position.col + 1 })}
                className="group cursor-pointer outline-none"
                onClick={() => activate(to)}
                onKeyDown={onKey(to)}
              >
                <rect
                  x={b.x + 1}
                  y={b.y + 1}
                  width={b.width - 2}
                  height={b.height - 2}
                  rx={3}
                  fill="var(--board-reachable)"
                  stroke="var(--fg)"
                  strokeWidth={0}
                  className="group-hover:[stroke-width:1.5] group-focus-visible:[stroke-width:2.5]"
                />
              </g>
            );
          }
          const b = rectBox(ROOM_RECTS[to.roomId]);
          return (
            <g
              key={locationKey(to)}
              role="button"
              tabIndex={0}
              aria-label={t("enterRoom", { room: card(to.roomId) })}
              className="group cursor-pointer outline-none"
              onClick={() => activate(to)}
              onKeyDown={onKey(to)}
            >
              <rect
                x={b.x + 2}
                y={b.y + 2}
                width={b.width - 4}
                height={b.height - 4}
                fill="var(--board-reachable)"
                fillOpacity={0.4}
                stroke="var(--board-reachable)"
                strokeWidth={3}
                className="group-hover:[fill-opacity:0.6] group-focus-visible:stroke-fg"
              />
            </g>
          );
        })}

        {/* Room labels */}
        <g aria-hidden="true" pointerEvents="none">
          {roomIds.map((roomId) => {
            const p = roomSlot(ROOM_RECTS[roomId], "label");
            return (
              <text
                key={roomId}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--fg)"
              >
                {card(roomId)}
              </text>
            );
          })}
        </g>

        {/* Face-down room cards (which card is private) */}
        {game.roomsWithCards.map((roomId) => {
          const p = roomSlot(ROOM_RECTS[roomId], "label");
          const x = p.x - card(roomId).length * 3.4 - 12;
          return (
            <g key={`room-card-${roomId}`} role="img" aria-label={t("roomCard")} pointerEvents="none">
              <rect x={x} y={p.y - 6.5} width={9} height={13} rx={1.5} fill="var(--brand)" stroke="var(--fg)" strokeWidth={1} />
              <rect x={x + 2} y={p.y - 4.5} width={5} height={9} rx={1} fill="none" stroke="var(--surface)" strokeWidth={1} />
            </g>
          );
        })}

        {/* Weapons */}
        <g>
          {placeWeapons(game).map(({ weaponId, roomId, point }) => {
            const Icon = cardIcon[weaponId];
            return (
              <g
                key={weaponId}
                role="img"
                aria-label={t("weapon", { weapon: card(weaponId), room: card(roomId) })}
                className="cursor-pointer transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
                {...tokenHandlers({ kind: "weapon", id: weaponId }, roomId, point, card(weaponId))}
              >
                {highlights.suggestedWeapon === weaponId && (
                  <rect
                    data-highlight="suggested"
                    pointerEvents="none"
                    x={-WEAPON_R - 2.5}
                    y={-WEAPON_R - 2.5}
                    width={WEAPON_R * 2 + 5}
                    height={WEAPON_R * 2 + 5}
                    rx={4}
                    fill="none"
                    stroke="var(--board-suggested)"
                    strokeWidth={2}
                  />
                )}
                <rect
                  x={-WEAPON_R}
                  y={-WEAPON_R}
                  width={WEAPON_R * 2}
                  height={WEAPON_R * 2}
                  rx={3}
                  fill="var(--surface)"
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <Icon x={-5} y={-5} width={10} height={10} color="var(--fg)" strokeWidth={2.25} aria-hidden="true" />
              </g>
            );
          })}
        </g>

        {/* Pawns */}
        <g>
          {placePawns(game).map(({ characterId, location, point }) => (
            <g
              key={characterId}
              role="img"
              aria-label={
                location.kind === "room"
                  ? t("pawnInRoom", { character: card(characterId), room: card(location.roomId) })
                  : t("pawnInCorridor", { character: card(characterId) })
              }
              className="cursor-pointer transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
              {...tokenHandlers(
                { kind: "pawn", id: characterId },
                location.kind === "room" ? location.roomId : null,
                point,
                pawnTip(characterId),
              )}
            >
              {highlights.suggestedCharacter === characterId && (
                <circle data-highlight="suggested"
                    pointerEvents="none" r={PAWN_R + 5.5} fill="none" stroke="var(--board-suggested)" strokeWidth={2} strokeDasharray="3 2" />
              )}
              {highlights.activeCharacter === characterId && (
                <circle data-highlight="active" pointerEvents="none" className="board-active-ring" r={PAWN_R + 4} fill="none" stroke="var(--board-active)" strokeWidth={2.5} />
              )}
              {characterId === myCharacter && (
                <circle r={PAWN_R + 2.5} fill="none" stroke="var(--brand-strong)" strokeWidth={2} />
              )}
              <circle r={PAWN_R} fill={characterColorVar[characterId]} stroke="var(--fg)" strokeWidth={1.5} />
            </g>
          ))}
        </g>
        {/* Tooltip for the tapped / hovered pawn or weapon */}
        {tip && (
          <g role="tooltip" pointerEvents="none">
            <text
              {...tooltipAnchor(tip.point, tip.text, view)}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {tip.text}
            </text>
          </g>
        )}
      </svg>

      <div className="mt-2 flex items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto">{toolbarStart}</div>
        <div className="flex shrink-0 gap-1">
          <ZoomButton label={t("zoomIn")} onClick={zoomIn}>
            <Plus aria-hidden="true" className="size-5" />
          </ZoomButton>
          <ZoomButton label={t("zoomOut")} onClick={zoomOut} disabled={!zoomed}>
            <Minus aria-hidden="true" className="size-5" />
          </ZoomButton>
          <ZoomButton label={t("resetZoom")} onClick={reset} disabled={!zoomed}>
            <RotateCcw aria-hidden="true" className="size-5" />
          </ZoomButton>
        </div>
      </div>
    </section>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-11 items-center justify-center rounded border border-line bg-surface text-fg shadow-sm disabled:opacity-40"
    >
      {children}
    </button>
  );
}
