# Protocol – HTTP, Socket.IO, state and errors

Single source of truth is `packages/contracts` (Zod schemas); this page is a readable map of it. Field-level details: `packages/contracts/src/game/index.ts`, `rooms/index.ts`, `settings/index.ts`, `events.ts`, `errors.ts`.

## 1. HTTP

| Method & path | Body / headers | Response | Errors |
|---|---|---|---|
| `GET /health` | – | `{ status: "ok" }` | – |
| `POST /rooms` | `{ playerName }` | `RoomSessionResponse` = `{ room: RoomSummary, session: { playerId, token } }` | `INVALID_PAYLOAD` |
| `POST /rooms/join` | `{ playerName, roomCode }` | `RoomSessionResponse` | `ROOM_NOT_FOUND`, `GAME_FULL`, `GAME_NOT_IN_LOBBY`, `NAME_TAKEN` |
| `GET /rooms/:code` | – | `{ code, phase, playerCount }` (used by the room-link screen) | `ROOM_NOT_FOUND` (also for a malformed code) |
| `GET /rooms/:code/session` | `Authorization: Bearer <token>` | `RoomSessionResponse` (restore after refresh) | `UNAUTHORIZED`, `ROOM_NOT_FOUND` |
| `POST /testing/rooms/:code/scenario` | `Scenario` | – | only with `ENABLE_TEST_API=1`, see §6 |

Non-2xx bodies are `{ code: ErrorCode }`. Validation: `playerName` 2–24 chars trimmed; `roomCode` 4–6 digits.

## 2. Socket.IO

Connect with `auth: { token }`. Identity (room + player) is taken from the token; **payloads never contain player identity**. On connect the server emits `room:state` and, if a game exists, `game:state` and `game:private`.

### 2.1 Client → server commands

All commands take an ack callback receiving `CommandResult` = `{ ok: true } | { ok: false, code }`. State changes are not returned in the ack; they arrive as pushes.

| Event | Payload | Who / when | Typical error codes |
|---|---|---|---|
| `room:choose_character` | `{ characterId }` | any player, lobby | `CHARACTER_TAKEN`, `GAME_NOT_IN_LOBBY` |
| `room:start` | `{}` | host, lobby, ≥ 2 players all with characters | `NOT_HOST`, `NOT_ENOUGH_PLAYERS`, `CHARACTER_REQUIRED` |
| `room:kick` | `{ playerId }` | host, lobby | `NOT_HOST`, `CANNOT_KICK_SELF`, `PLAYER_NOT_FOUND` |
| `room:rename` | `{ name }` | any player | `NAME_TAKEN` |
| `room:settings` | partial `RoomSettings` | host, lobby | `NOT_HOST`, `GAME_NOT_IN_LOBBY`, `INVALID_SETTINGS` |
| `turn:roll` | `{}` | active player | `NOT_YOUR_TURN`, `ALREADY_ROLLED`, `ALREADY_MOVED`, `ALREADY_SUGGESTED`, `DISPROVE_PENDING` |
| `turn:move` | `{ to: Location }` | active player after rolling | `NOT_ROLLED`, `UNREACHABLE`, `ALREADY_SUGGESTED` |
| `turn:passage` | `{}` | active player at turn start in a corner room | `NO_SECRET_PASSAGE`, `ALREADY_ROLLED`, `ALREADY_SUGGESTED` |
| `turn:suggest` | `{ suspect, weapon }` (room = current room) | active player | `CANNOT_SUGGEST` |
| `turn:disprove` | `{ cardId }` | the current disprover | `NOT_YOUR_DISPROVE`, `CARD_NOT_MATCHING` |
| `turn:accuse` | `{ suspect, weapon, room }` | active player | `NOT_IN_ROOM`, `WRONG_ROOM`, `ACCUSE_AFTER_SUGGESTION_DISABLED`, `DISPROVE_PENDING` |
| `turn:end` | `{}` | active player | `DISPROVE_PENDING` |

Common to game commands: `GAME_NOT_IN_PROGRESS`, `NOT_YOUR_TURN`, `PLAYER_ELIMINATED`; transport: `INVALID_PAYLOAD`, `UNAUTHORIZED`, `INTERNAL`.

### 2.2 Server → client pushes

| Event | Audience | Payload |
|---|---|---|
| `room:state` | room | `RoomSummary` |
| `game:state` | room | `PublicGameState` |
| `game:private` | one player | `PrivateGameState` |
| `room:kicked` | the removed player's sockets (then disconnected) | – |

## 3. State shapes (summary)

**`RoomSummary`** – `id` (current game id, changes when a new game starts; keys the notebook), `code`, `hostId`, `maxPlayers`, `phase` (`LOBBY` / `IN_PROGRESS` / `FINISHED`), `players[]` (`id`, `name`, `characterId?`, `presence`), `lastResult` (`winnerId`, `winnerName`, `reason`, `envelope`) or null, `settings`.

**`RoomSettings`** – `accusationPlace`, `accuseAfterSuggestion`, `suggestAfterStaying`, `turnTimeLimitSec`, `disproveTimeLimitSec`, `roomCards`, `autoNotes` (see [`../product/features.md` §4.1](../product/features.md#41-room-settings-house-rules)).

**`PublicGameState`** – `gameId`, `status`, `players[]` (`id`, `name`, `characterId`, `cardCount`, `eliminated`, `presence`), `turnOrder`, `turn` (`playerId`, `dice`, `hasMoved`, `pendingSuggestion` = `{ suggesterId, suggestion, disproverId }` or null), `pawns[]`, `weapons[]`, `events[]` (`{ seq, event }`, full history, oldest first), `winner`, `envelope` (only when finished), `settings`, `timer` (`kind`, `playerId`, `remainingMs`, `durationMs`) or null, `roomsWithCards[]`.

**`PrivateGameState`** – `gameId`, `playerId`, `hand`, `availableActions` (`roll`, `move`, `passage`, `suggest`, `accuse`, `end_turn`, `disprove`), `reachable[]`, `disproveRequest` (`suggesterId`, `suggestion`, `matchingCards`) or null, `seenCards[]` (`cardId`, `fromPlayerId`), `envelope` (eliminated accuser only) or null, `roomCards[]` (`roomId`, `cardId`; rooms the player has stood in).

**`Location`** – `{ kind: "cell", position: { row, col } }` or `{ kind: "room", roomId }` (a pawn is never "on a door").

## 4. Game events (public log)

`game_started`, `rolled`, `moved`, `passage_used`, `suggested`, `cannot_disprove`, `card_shown` (who → to whom, **no card**), `no_one_disproved`, `accused` (with `correct`), `turn_ended`, `turn_skipped` (away), `turn_timed_out`, `disprove_timed_out` (precedes the automatic `card_shown`), `game_won` (`ACCUSATION` / `LAST_STANDING`).

Events never carry hidden card ids; the client derives the log text and notebook deductions from them.

## 5. Error codes

Defined in `packages/contracts/src/errors.ts` (`errorCodes`), mirrored from `GameErrorCode` in the domain, translated in `apps/web/src/shared/errors/i18n.ts`.

- Transport / session: `INVALID_PAYLOAD`, `UNAUTHORIZED`, `ROOM_NOT_FOUND`, `NAME_TAKEN`, `INTERNAL`.
- Lobby: `GAME_FULL`, `PLAYER_ALREADY_JOINED`, `PLAYER_NOT_FOUND`, `CHARACTER_TAKEN`, `NOT_HOST`, `NOT_ENOUGH_PLAYERS`, `CHARACTER_REQUIRED`, `GAME_NOT_IN_LOBBY`, `GAME_NOT_FINISHED`, `CANNOT_KICK_SELF`, `INVALID_SETTINGS`.
- Game: `GAME_NOT_IN_PROGRESS`, `NOT_YOUR_TURN`, `PLAYER_ELIMINATED`, `DISPROVE_PENDING`, `ALREADY_ROLLED`, `ALREADY_MOVED`, `NOT_ROLLED`, `UNREACHABLE`, `NO_SECRET_PASSAGE`, `CANNOT_SUGGEST`, `ALREADY_SUGGESTED`, `NOT_YOUR_DISPROVE`, `CARD_NOT_MATCHING`, `NOT_IN_ROOM`, `WRONG_ROOM`, `ACCUSE_AFTER_SUGGESTION_DISABLED`.

Adding a code: domain `GameErrorCode` → `errorCodes` → EN + PL translation.

## 6. Test scenario API

`POST /testing/rooms/:code/scenario` (module loaded only with `ENABLE_TEST_API=1`; Playwright sets it). Applied to a **started** game; all fields optional; players referenced **by name**. Schema: `packages/contracts/src/testing/index.ts`.

| Field | Effect |
|---|---|
| `envelope` | Set the solution |
| `hands` | `{ playerName: CardId[] }` |
| `pawns` | `{ characterId: Location }` |
| `weapons` | `{ weaponId: RoomId }` |
| `dice` | Queue of upcoming rolls, e.g. `[[3,4],[1,1]]` |
| `activePlayer` | Make this player active with a fresh turn |
| `summonedTo` | `{ playerName: RoomId }` – mark as summoned (may suggest without moving) |
| `roomCards` | `{ roomId: CardId }` – replaces dealt room cards (hands not adjusted) |
| `settings` | Override house rules of the running game |
| `timeLimitsMs` | `{ turn?, disprove? }` – override limits in ms and restart countdowns |

The scenario file is append-only (hot file) – add fields, never restructure.
