import type { KeyboardEvent, ReactNode } from "react";
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, Minus, Plus, RotateCcw } from "lucide-react";
import type { Location, PrivateGameState, PublicGameState } from "@mystery-game/contracts";
import {
  CELLS,
  CENTER_RECT,
  DOORS,
  ROOM_RECTS,
  SECRET_PASSAGES,
  roomIds,
  type RoomId,
} from "@mystery-game/game";
import { cardIcon, cardMessages, characterColorVar } from "../cards/index.js";
import { myPlayer } from "../players/index.js";
import { useT } from "../../shared/i18n/index.js";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL,
  cellBox,
  doorSegment,
  rectBox,
  roomSlot,
  viewBoxAttr,
} from "./geometry.js";
import { boardMessages } from "./i18n.js";
import { locationKey, placePawns, placeWeapons } from "./selectors.js";
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

export function Board({ game, me, myId, onMove, toolbarStart }: Props) {
  const t = useT(boardMessages);
  const card = useT(cardMessages);
  const { view, svgRef, zoomed, zoomIn, zoomOut, reset, handlers } = useBoardView();
  const myCharacter = myPlayer(game, myId)?.characterId;
  const reachable = onMove ? (me?.reachable ?? []) : [];

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

        {/* Weapons */}
        <g pointerEvents="none">
          {placeWeapons(game).map(({ weaponId, roomId, point }) => {
            const Icon = cardIcon[weaponId];
            return (
              <g
                key={weaponId}
                role="img"
                aria-label={t("weapon", { weapon: card(weaponId), room: card(roomId) })}
                className="transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
              >
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
        <g pointerEvents="none">
          {placePawns(game).map(({ characterId, location, point }) => (
            <g
              key={characterId}
              role="img"
              aria-label={
                location.kind === "room"
                  ? t("pawnInRoom", { character: card(characterId), room: card(location.roomId) })
                  : t("pawnInCorridor", { character: card(characterId) })
              }
              className="transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
            >
              {characterId === myCharacter && (
                <circle r={PAWN_R + 2.5} fill="none" stroke="var(--brand-strong)" strokeWidth={2} />
              )}
              <circle r={PAWN_R} fill={characterColorVar[characterId]} stroke="var(--fg)" strokeWidth={1.5} />
            </g>
          ))}
        </g>
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
