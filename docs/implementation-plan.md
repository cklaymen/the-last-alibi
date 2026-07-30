Players enter with a nickname and a private room code. There are no accounts, bots, public matchmaking, chat, ranking, or offline play in the first release.

## Design reference audit

`docs/cluedo.pdf` currently contains a component sheet rather than complete game screens. It defines the visual treatment for `Create room`: a white canvas, muted green default state, lighter-green hover state, pale-gray disabled state, white label, generous vertical padding, and rounded corners. The lobby uses these same interaction states for its primary actions. No board, card, notebook, or character-selection layout is present in the supplied PDF, so those views remain implementation work rather than a visual reproduction target.

# The Last Alibi: implementation plan

## Product boundary

The first release is a mobile-first online deduction game for three to six invited players. Players enter with a pseudonym and a private room code. There are no accounts, bots, public matchmaking, chat, ranking, or offline play in the first release.

The project uses an original name and should receive original presentation assets before public release. Do not present it as Cluedo or reuse protected names and artwork without verified permission.

## Architecture

- `apps/web`: React and Vite client, responsible for rendering game-specific views and sending player intent.
- `apps/api`: NestJS service, responsible for room lifecycle and, later, authoritative game commands and Socket.IO updates.
- `packages/game`: framework-independent, deterministic game rules. The API is its only production caller.
- `packages/contracts`: Zod schemas and TypeScript types shared by web and API.
- `apps/e2e`: Playwright suite.

The client must never decide whether a move, suggestion, accusation, or card reveal is valid. The API validates a command against the game package, stores the accepted result, and emits a player-specific game projection.

## Verification requirements

Every change must pass `pnpm typecheck`, `pnpm test`, and `pnpm build`. Before release, Playwright must cover create/join, character selection, turns, private-card visibility, suggestions, accusations, reconnection, and mobile/desktop viewports.

---

## Task checklist

### Foundation

- [x] pnpm / Turborepo monorepo with `apps/api`, `apps/web`, `apps/e2e`, `packages/game`, `packages/contracts`
- [x] `packages/game` — deterministic domain: `createGame`, `joinGame`, `chooseCharacter`, `setPlayerReady` with Vitest coverage
- [x] `packages/contracts` — Zod schemas + TypeScript types shared by web and API
- [x] Health endpoint (`GET /health`)
- [x] In-memory room endpoints (`POST /rooms`, `POST /rooms/join`)
- [x] Mobile-first create/join UI (React + Vite)

### Realtime lobby (Socket.IO)

- [x] `room:subscribe` — client joins Socket.IO channel and receives current snapshot
- [x] `room:state` — broadcast to all room subscribers on join and on start
- [x] `room:start` — host starts game; broadcasts updated state
- [x] Playwright suite: two-browser create/join scenario

### Room codes

- [x] Simple 6-digit numeric codes (e.g. `482916`) — no prefix
- [x] Zod schema validates 4–6 digits
- [x] UI input restricted to digits; placeholder updated

### Character selection & authoritative game state

- [x] `character:choose` socket event — server validates via `packages/game`, broadcasts `room:state`
- [x] `player:ready` socket event — server validates via `packages/game`, broadcasts `room:state`
- [x] Character grid in lobby: 6 coloured cards, selected/taken/available states
- [x] Player list in lobby: shows each player and their chosen character
- [x] Start button enabled only when all players have chosen a character (≥ 2 players)
- [x] `room:error` event emitted to client on invalid action
- [x] `RoomsService` backed by authoritative `Game` objects from `packages/game`
- [x] `RoomSummary` contract extended with `players[]` (id, name, characterId, isReady)
- [x] Playwright: character selection + start + taken-character enforcement

### i18n groundwork

- [x] `apps/web/src/i18n/index.ts` — locale-keyed translations map; `t()` helper; `setLocale()` for future language switching
- [x] All visible UI strings in `App.tsx` sourced from `t()`

### Still to do

- [ ] Signed per-player session tokens; disconnect handling and reconnect grace period
- [ ] PostgreSQL + Prisma: room persistence, event log
- [ ] Complete domain: card dealing, board graph, movement, suggestions, disprovals, accusations, end states
- [ ] Game-board views: private notebook, card-hand projection, board rendering
- [ ] API integration tests with PostgreSQL
- [ ] Playwright scenarios: reconnection, private-card visibility, suggestions, accusations, mobile/desktop viewports
- [ ] Original presentation assets (character portraits, board artwork)
