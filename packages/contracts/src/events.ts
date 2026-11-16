import type { CommandResult } from "./errors.js";
import type {
  AccuseCommand,
  DisproveCommand,
  MoveCommand,
  PrivateGameState,
  PublicGameState,
  SuggestCommand,
} from "./game/index.js";
import type {
  ChooseCharacterRequest,
  KickPlayerRequest,
  RenamePlayerRequest,
  RoomSummary,
} from "./rooms/index.js";
import type { UpdateSettingsRequest } from "./settings/index.js";

/**
 * Socket.IO event names. Identity comes from the handshake (`auth: { token }`);
 * on connect the server joins the socket to its room and immediately emits
 * `room:state` and – if a game exists – `game:state` + `game:private`.
 * When a game ends the room returns to LOBBY right away (`room.lastResult`).
 */
export const ClientEvents = {
  chooseCharacter: "room:choose_character",
  start: "room:start",
  kick: "room:kick",
  rename: "room:rename",
  /** Host only, LOBBY only; partial settings. */
  updateSettings: "room:settings",
  roll: "turn:roll",
  move: "turn:move",
  passage: "turn:passage",
  suggest: "turn:suggest",
  disprove: "turn:disprove",
  accuse: "turn:accuse",
  endTurn: "turn:end",
} as const;

export const ServerEvents = {
  roomState: "room:state",
  gameState: "game:state",
  gamePrivate: "game:private",
  /** Sent to a kicked player's sockets right before they are disconnected. */
  kicked: "room:kicked",
} as const;

type Ack = (result: CommandResult) => void;

export interface ClientToServerEvents {
  "room:choose_character": (payload: ChooseCharacterRequest, ack: Ack) => void;
  "room:start": (payload: Record<string, never>, ack: Ack) => void;
  "room:kick": (payload: KickPlayerRequest, ack: Ack) => void;
  "room:rename": (payload: RenamePlayerRequest, ack: Ack) => void;
  "room:settings": (payload: UpdateSettingsRequest, ack: Ack) => void;
  "turn:roll": (payload: Record<string, never>, ack: Ack) => void;
  "turn:move": (payload: MoveCommand, ack: Ack) => void;
  "turn:passage": (payload: Record<string, never>, ack: Ack) => void;
  "turn:suggest": (payload: SuggestCommand, ack: Ack) => void;
  "turn:disprove": (payload: DisproveCommand, ack: Ack) => void;
  "turn:accuse": (payload: AccuseCommand, ack: Ack) => void;
  "turn:end": (payload: Record<string, never>, ack: Ack) => void;
}

export interface ServerToClientEvents {
  "room:state": (room: RoomSummary) => void;
  "game:state": (state: PublicGameState) => void;
  "game:private": (state: PrivateGameState) => void;
  "room:kicked": () => void;
}
