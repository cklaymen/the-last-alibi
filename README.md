# The Last Alibi

An online deduction board game for 2–6 players (a "who, with what, and where" mechanic) with its own original presentation. Players join a private room via a code or a link, pick a character, and then take turns rolling dice, moving around the board, suggesting, disproving, and accusing. The first player to correctly name the contents of the envelope wins.

- mobile first, responsive layout on desktop;
- light / dark / system theme, PL / EN interface;
- detective notebook saved in the browser;
- room link (`/room/<code>`), remembered nickname, nickname change inside a room;
- player presence: after 30 s of absence a player in the lobby leaves the room; during a game their turns are skipped and the server shows cards on their behalf;
- after a game ends, everyone returns to the lobby of the same room with a summary of the last match.

Game rules: [`docs/cluedo-rules.md`](docs/cluedo-rules.md) (the "Implementation clarifications" section is binding). Plan and architecture: [`docs/game-screens-plan.md`](docs/game-screens-plan.md).

## Technologies

| Area | Technologies |
|---|---|
| Monorepo | pnpm 10 (workspaces), Turborepo 2, TypeScript 5.9 (strict), Node.js ≥ 22 |
| Domain (`packages/game`) | pure TypeScript with no runtime dependencies, immutable functions returning `Result`, injected RNG |
| Contracts (`packages/contracts`) | Zod 4 – HTTP/WebSocket schemas, Socket.IO event types, error codes |
| API (`apps/api`) | NestJS 11, Socket.IO 4, in-memory repositories (interfaces ready for a database) |
| Web (`apps/web`) | React 19, Vite 7, Tailwind CSS 4 (CSS tokens for themes), lucide-react, socket.io-client; no Redux and no routing library |
| Tests | Vitest (domain, API with `@nestjs/testing` and socket.io-client, web with Testing Library + jsdom), Playwright (E2E, `mobile-chromium` and `desktop-chromium` projects) |
| Deployment | Docker (multi-stage), docker compose, nginx (static web + proxy for `/api` and `/socket.io`) |

### Architecture at a glance

```
packages/game        game rules (pure functions)          ◄── the only source of rules
packages/contracts   Zod + types shared by API and web
apps/api             transport (HTTP + Socket.IO), sessions, presence, state projections
apps/web             views; shows only the actions allowed by the server
apps/e2e             Playwright tests (multi-player fixtures, Page Objects)
```

- **The server is authoritative.** The client sends an intent (e.g. `turn:move`), the server validates it with functions from `packages/game` and broadcasts the state.
- **Projections.** The public state (`game:state`) goes to everyone, while the private state (`game:private`: hand, allowed actions, reachable cells, disprove request, shown cards) goes only to its owner. The envelope and other players' cards never reach the public state.
- **Identity.** A player receives a session token when creating or joining a room; the socket authenticates with the token in the handshake.
- **Feature folders** in every layer; i18n dictionaries per feature (EN + PL).

## Running locally (dev)

Requirements: Node.js ≥ 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm --filter @mystery-game/game --filter @mystery-game/contracts build   # shared libraries
pnpm dev                                                                   # API :3000 + web :5173
```

The app runs at <http://localhost:5173>. Environment variables are described in [`.env.example`](.env.example):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | API port |
| `WEB_ORIGIN` | `http://localhost:5173` | web origin (CORS) |
| `PRESENCE_GRACE_MS` | `30000` | how many ms after disconnecting a player leaves the lobby / is marked as away in a game |
| `ENABLE_TEST_API` | — | `1` enables `POST /testing/rooms/:code/scenario` (E2E tests only) |
| `VITE_API_URL` | `http://localhost:3000` | API address for the web app (can be relative, e.g. `/api`, behind a reverse proxy) |

## Running in Docker

```bash
docker compose up --build
```

The game is available at <http://localhost:8080>; you can change the port with `WEB_PORT=9000 docker compose up`. The `web` container (nginx) serves the built app and forwards `/api/*` and `/socket.io/*` to the `api` container, so everything runs on a single origin. Game state is kept in the API's memory, so restarting the container wipes all rooms.

### Public deployment via Cloudflare Tunnel

1. In Cloudflare Zero Trust create a tunnel and add a Public Hostname (e.g. `cluedo.example.com`) with service `http://web:80`.
2. `cp .env.docker.example .env` and fill in `WEB_ORIGIN` (the public URL) and `TUNNEL_TOKEN`.
3. `docker compose --profile tunnel up -d --build`

No ports are exposed to the outside world; `web` is bound to `127.0.0.1` only.

## Tests and quality

```bash
pnpm typecheck     # TypeScript in all packages
pnpm test          # unit tests: domain, API, web (Vitest)
pnpm build         # build all packages
pnpm test:e2e      # Playwright; starts the API (:3100) and web (:5174) itself
```

Before running E2E for the first time, install the browser: `pnpm --filter @mystery-game/e2e exec playwright install chromium`.

## Repository structure

```
apps/
  api/        NestJS: modules/{session,rooms,game,presence,testing}, shared/
  web/        React: app/, features/<feature>/, shared/{ui,i18n,errors,lib}
  e2e/        Playwright: fixtures/, pages/, tests/
packages/
  game/       src/{lobby,setup,board,movement,suggestion,accusation,turn-flow,presence,shared}
  contracts/  src/{session,rooms,game,testing}, errors.ts, events.ts
docker/       nginx configuration
docs/         rules, implementation plan, design references
```
