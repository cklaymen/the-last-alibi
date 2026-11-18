# Architecture

How the application is built and the technical requirements every change must respect. Reasons for the main choices are in [`adr.md`](adr.md); the wire protocol is in [`protocol.md`](protocol.md); testing in [`testing.md`](testing.md).

## 1. Stack

| Area | Technology |
|---|---|
| Monorepo | pnpm 10 workspaces, Turborepo 2, TypeScript 5.9 `strict`, Node.js ≥ 22 |
| Domain `packages/game` | Plain TypeScript, **zero runtime dependencies** |
| Contracts `packages/contracts` | Zod 4 schemas + inferred types |
| API `apps/api` | NestJS 11, Socket.IO 4, in-memory repositories |
| Web `apps/web` | React 19, Vite 7, Tailwind CSS 4 (CSS tokens), lucide-react icons, socket.io-client |
| Tests | Vitest (all packages), Testing Library + jsdom (web), `@nestjs/testing` + socket.io-client (API), Playwright (e2e) |
| Lint | ESLint flat config + `eslint-plugin-boundaries` (`eslint.config.mjs`) |
| Deployment | Multi-stage `Dockerfile`, `docker-compose.yml` (api + nginx web, optional Cloudflare Tunnel profile) |

## 2. Layers

```
packages/game        pure domain rules              ◄── the only source of game rules
      ▲
packages/contracts   Zod schemas + types            (imports ids/constants from game)
      ▲                      ▲
apps/api             apps/web                        (web: only static data + types from game)
transport, sessions, views; renders what the
presence, projection, server allows
timers
      ▲
apps/e2e             black-box Playwright           (may import only contracts)
```

Enforced by `pnpm lint`:
- Dependency direction as above; no reverse imports.
- `apps/web` may import from `@mystery-game/game` only **static data and types** (ids, `BOARD_LAYOUT`, option lists) – a whitelist in `eslint.config.mjs`. It never calls rule functions.
- **Feature folders** in every layer; another feature/module is imported only through its `index.ts` (exception: `game/src/board/layout.ts`). Tests may import fixtures/i18n of other web features.
- `game` and `contracts` are consumed from `dist/` – rebuild them after changes (`pnpm --filter @mystery-game/game --filter @mystery-game/contracts build`).

## 3. Modules

### `packages/game/src`

| Module | Responsibility |
|---|---|
| `shared/` | Types and ids (`types.ts`), `Result` (`ok`/`fail`, `GameErrorCode`), guards (`requireActivePlayer`…), play helpers (`startTurn`, `nextPlayer`, `withEvents`), `shuffle`/random helpers |
| `board/` | `layout.ts` – 24×25 grid, rooms, doors with direction, passages, start squares, render geometry (`BOARD_LAYOUT`) |
| `lobby/` | create/join/leave/kick/rename, character choice, settings validation (`settings.ts`), `returnToLobby` |
| `setup/` | `startGame`: pawns, weapons, envelope, dealing, turn order |
| `room-cards/` | Laying out face-down room cards, visibility per player |
| `movement/` | Roll, `reachableFor`, move, secret passage |
| `suggestion/` | Suggest, disprove queue, `autoDisprove`, `matchingCards` |
| `accusation/` | Accuse, elimination, win conditions |
| `turn-flow/` | `endTurn`, `availableActions`, timeouts |
| `presence/` | `resolveAway` – skipping away players, auto-disproving for them |

Every rule function is **pure and immutable**: `(game, …args) → GameResult` = `{ ok: true, game } | { ok: false, code }`. No exceptions, no I/O. Randomness via injected `Rng` (`() => number`), time never read inside the domain.

### `packages/contracts/src`

`ids.ts` (Zod enums built from game ids), `session/`, `rooms/`, `settings/`, `game/` (public/private state, events, commands), `errors.ts` (`errorCodes`, `CommandResult`), `events.ts` (socket event names + typed `ClientToServerEvents` / `ServerToClientEvents`), `testing/` (scenario schema). Compile-time guards keep contract types identical to domain types (e.g. `RoomSettings`).

### `apps/api/src/modules`

| Module | Responsibility |
|---|---|
| `session/` | `SessionRepository` (opaque UUID token → `{ roomCode, playerId }`), bearer/handshake parsing |
| `rooms/` | HTTP: create / join / info / restore session (`RoomsController`, `RoomsService`) |
| `game/` | `GameGateway` (Socket.IO transport), `GameService` (orchestration, commit pipeline), `commands/` (one handler per socket command + append-only registry `commands/index.ts`), `projection/GameProjector` (visibility), `notifier/` (room + per-player channels), `repository/` (in-memory `GameRepository`), `clock/` (`Clock`, `TurnClock`), `rng.ts` |
| `presence/` | `PresenceRegistry` (sockets per player, grace timers), `Timer` abstraction, options from env |
| `testing/` | `POST /testing/rooms/:code/scenario`, only when `ENABLE_TEST_API=1` |
| `shared/` (src) | Zod payload validation, `AppError` → error code mapping filter, ack helper |

### `apps/web/src`

- `app/` – `App`, `AppHeader`, `screens.tsx` (chooses Join / Lobby / Game by state), version.
- `features/` – `join`, `session`, `lobby`, `game` (provider, context, selectors, `GameScreen`, `ActionSection`), `board`, `players`, `turn` (`TurnPanel`, action registry `actions.ts`, `useCommand`), `suggestion`, `accusation`, `disprove`, `room-cards`, `timer`, `event-log`, `notebook` (UI section "Cards"), `cards` (`CardTile`, `CardSelectGrid`, `CardHint`, avatars, `cardArt.ts`), `room-settings` (`RoomSettingsView`, shared by lobby and game), `rules-help` (header rules summary), `nickname`, `theme`, `locale`.
- `shared/` – `ui/` (Button, ModalDialog, Collapsible, Tooltip, ToggleGroup…), `i18n/`, `errors/`, `lib/` (router, storage).

## 4. Runtime data flow

### 4.1 Connection

1. `POST /rooms` or `POST /rooms/join` → `{ room, session: { playerId, token } }`. The web stores the session (sessionStorage + localStorage fallback).
2. Socket.IO connects with `auth: { token }`. Handshake middleware resolves the token to `socket.data.{roomCode, playerId}`; an unknown token is rejected (`UNAUTHORIZED`).
3. The socket joins the room channel and `player:<id>` channel; presence marks the player online.
4. The server immediately emits `room:state` and, if a game exists, `game:state` + `game:private`.

### 4.2 Command lifecycle

```
client emit("turn:move", payload, ack)
  → GameGateway: find handler in registry, identity from socket.data (never from payload)
  → GameService.execute: Zod-parse payload → handler.execute(game, playerId, payload, deps)
      → pure domain function → GameResult
  → fail: ack({ ok:false, code })
  → ok:  commit(game):
          settle   (resolveAway: skip away players / auto-disprove; auto return to lobby when finished)
          save     (GameRepository)
          clock.sync (start/pause/resume/cancel countdowns)
          publish  (StatePublisher → GameNotifier) room:state + game:state to the room,
                   game:private to each player
         ack({ ok:true })
```

Timer expiry and presence changes go through the same `commit` path, so every state change is settled, saved and broadcast identically.

### 4.3 Projections and privacy

`GameProjector` is **the only place** that decides visibility:
- **Public** (`game:state`, to the room): players with card counts and presence, turn order, turn (dice, pending suggestion without cards), pawns, weapons, full event log, winner, envelope only when finished, settings, timer, rooms holding a room card.
- **Private** (`game:private`, per player): hand, `availableActions`, `reachable`, `disproveRequest` (matching cards, disprover only), `seenCards`, envelope (only for a player eliminated by a wrong accusation), room cards of rooms the player has stood in.

Domain events are public by construction (they never contain card ids of shown or room cards). Any new private data requires an API test proving another player's socket never receives it.

### 4.4 Timers

`TurnClock` (`apps/api/src/modules/game/clock/turn-clock.ts`) keeps per-room countdowns using an injected `Clock` and `Timer`:
- A **turn key** (`<gameId>:<index of last turn-start event>`) identifies the current turn; a new key starts a fresh turn countdown.
- While a suggestion is pending the turn countdown is **paused** (remaining time kept) and a disprove countdown runs, keyed by the suggestion.
- On expiry the service re-checks `isCurrent(key)`; stale expiries (turn changed, game ended, room deleted) are ignored. The domain then applies the timeout (end turn / random card).
- The public `timer` field shows the disprove countdown when running, otherwise the turn countdown.

### 4.5 Presence

`PresenceRegistry` counts sockets per player (multiple tabs). On the last disconnect the player becomes `offline` and a grace timer (`PRESENCE_GRACE_MS`, default 30 000 ms) starts; on expiry the player is removed (lobby) or marked `away` (game), and `commit` applies `resolveAway`. Reconnecting cancels the timer.

### 4.6 State storage

All rooms, games and sessions live **in memory** behind repository interfaces (`GameRepository`, `SessionRepository`). Restarting the API wipes everything. A room is deleted when its last player leaves.

## 5. Web client design

- **State:** `SessionProvider` (session lifecycle) and `GameProvider` (socket, `room`, public `game`, private `me`, `send`) in React context; derived values via **pure selectors** (`features/*/selectors.ts`). No Redux, no router library (tiny History API router with `/` and `/room/<code>`).
- **Server-driven UI:** buttons only from `me.availableActions`; clickable board targets only from `me.reachable`. Turn actions are registered in `features/turn/actions.ts` (each action is a component from its own feature).
- **Commands:** `useCommand` emits with ack and exposes pending/error state; errors are translated codes.
- **Shared card UI:** `CardTile`, `CardSelectGrid`, `CardIcon`, `CharacterAvatar`, `EnvelopeCards`; appearance mapped in one place (`cards/cardArt.ts`).
- **Browser storage keys:** `theme`, `locale`, `nickname`, `session:<code>` / `session:last`, `notebook:v2:<gameId>:<playerId>`, `notebook:showPlayers`, `ui:collapsed:<id>`. Every access is wrapped in try/catch.

## 6. Technical requirements (binding)

| Area | Requirement |
|---|---|
| Authority | Server validates everything; client sends intents only. |
| Identity | From the handshake token; never from payload. Host is recognised by `hostId`. |
| Determinism | No `Math.random()`, `Date.now()` or `setTimeout` in logic; inject `Rng`, `Clock`, `Timer`. |
| Errors | Codes, not texts. New `GameErrorCode` → `contracts/errors.ts` → EN+PL in `web/shared/errors/i18n.ts`. |
| Commands | New socket command = `commands/<name>.handler.ts` + one appended entry in `commands/index.ts`; ack with `CommandResult`; state pushed via `game:state` / `game:private`. |
| i18n | Every UI string in `features/<x>/i18n.ts` with `en` and `pl`; `pl` typed by `en` (completeness enforced by TypeScript). |
| Styles | Tailwind with CSS tokens from `apps/web/src/styles.css` only; a new colour = a token defined for both light and dark themes; AA contrast. |
| Motion | Animations only under `prefers-reduced-motion: no-preference`. |
| Accessibility | Interactive elements have a role and an accessible name; tests select by role/label in EN. |
| Storage | `localStorage`/`sessionStorage` always in try/catch; app must work when it throws. |
| Size | Small, focused files; follow existing patterns; no new dependency without a stated reason. |
| Hot files | Append-only (merge conflicts: keep both): `apps/api/src/modules/game/commands/index.ts`, `apps/api/src/modules/testing/scenario.ts`, `packages/contracts/src/testing/index.ts`, `packages/game/src/index.ts`, `apps/web/src/features/game/ActionSection.tsx`, `apps/e2e/pages/GamePage.ts`. |

## 7. Configuration and deployment

| Variable | Default | Used by | Meaning |
|---|---|---|---|
| `PORT` | `3000` | api | HTTP/WS port |
| `WEB_ORIGIN` | `http://localhost:5173` | api | Allowed CORS origin |
| `PRESENCE_GRACE_MS` | `30000` | api | Grace period before a disconnected player is removed / away |
| `ENABLE_TEST_API` | unset | api | `1` enables the scenario endpoint (tests only, never in production) |
| `VITE_API_URL` | `http://localhost:3000` | web build | API base URL (may be relative, e.g. `/api`) |
| `GIT_SHA` | unset | web build (Docker arg) | Short commit hash appended to the version |
| `WEB_PORT`, `TUNNEL_TOKEN` | `8080`, – | compose | Exposed port; Cloudflare Tunnel token (`--profile tunnel`) |

Docker: `docker compose up --build` → nginx serves the web build and proxies `/api/*` and `/socket.io/*` to the api container (single origin). See the root `README.md` for local dev and tunnel setup.

Continuous deployment: `.github/workflows/deploy.yml` – on push to `main`, a `checks` job (lint, typecheck, unit tests) runs on GitHub-hosted runners; when it passes, a `deploy` job on the self-hosted runner (label `cluedo`) runs `docker compose -p cluedo --env-file /srv/cluedo/.env --profile tunnel up -d --build --wait`. Deploys never overlap (`concurrency: deploy`). E2E tests are not part of the pipeline. Server setup and the required fork-PR approval setting are in the root `README.md`.
