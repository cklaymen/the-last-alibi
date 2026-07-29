# The Last Alibi: implementation plan

## Product boundary

The first release is a mobile-first online deduction game for three to six invited players. Players enter with a pseudonym and a private room code. There are no accounts, bots, public matchmaking, chat, ranking, or offline play in the first release.

The project uses an original name and should receive original presentation assets before public release. Do not present it as Cluedo or reuse protected names and artwork without verified permission.

## Architecture

- `apps/web`: React and Vite client, responsible for rendering game-specific views and sending player intent.
- `apps/api`: NestJS service, responsible for room lifecycle and, later, authoritative game commands and Socket.IO updates.
- `packages/game`: framework-independent, deterministic game rules. The API is its only production caller.
- `packages/contracts`: Zod schemas and TypeScript types shared by web and API.
- `apps/e2e`: Playwright suite to be added once the multiplayer gateway is implemented.

The client must never decide whether a move, suggestion, accusation, or card reveal is valid. The API validates a command against the game package, stores the accepted result, and emits a player-specific game projection.

## Current milestone

The initial repository contains the pnpm/Turborepo foundation, a tested lobby-domain package, Zod contracts, a health endpoint, in-memory create/join room endpoints, and a mobile-first create/join UI. The room data is intentionally ephemeral until PostgreSQL persistence is introduced.

## Next milestones

1. Add Socket.IO presence, per-room authorization token, reconnect grace period, and live lobby updates.
2. Add PostgreSQL and Prisma snapshots/event log. Move room persistence out of memory.
3. Complete the domain: character selection, ready/start, card dealing, board graph, movement, suggestions, disprovals, accusations, and end states.
4. Implement game-board views from `docs/cluedo.pdf`, private notebook and card-hand projections.
5. Add Vitest rules coverage, API integration tests with PostgreSQL, and Playwright scenarios for multiple independent browser contexts.

## Verification requirements

Every change must pass `pnpm typecheck`, `pnpm test`, and `pnpm build`. Before release, Playwright must cover create/join, character selection, turns, private-card visibility, suggestions, accusations, reconnection, and mobile/desktop viewports.
