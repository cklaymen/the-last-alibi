Players enter with a nickname and a private room code. There are no accounts, bots, public matchmaking, chat, ranking, or offline play in the first release. All player-facing UI copy is English.
The initial repository contains the pnpm/Turborepo foundation, a tested lobby-domain package, Zod contracts, a health endpoint, in-memory create/join room endpoints, and a mobile-first create/join UI. The room data is intentionally ephemeral until PostgreSQL persistence is introduced.

The realtime lobby milestone adds Socket.IO room subscriptions. Every subscribed client receives the latest `room:state` snapshot when a player joins and when the host starts the game. The host can start at two players. This first transport version identifies the host by nickname and is therefore suitable only for the local MVP; signed per-player session tokens are required before public deployment.

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
- `apps/e2e`: Playwright suite to be added once the multiplayer gateway is implemented.

The client must never decide whether a move, suggestion, accusation, or card reveal is valid. The API validates a command against the game package, stores the accepted result, and emits a player-specific game projection.

## Current milestone

The initial repository contains the pnpm/Turborepo foundation, a tested lobby-domain package, Zod contracts, a health endpoint, in-memory create/join room endpoints, and a mobile-first create/join UI. The room data is intentionally ephemeral until PostgreSQL persistence is introduced.

## Next milestones

1. Add Socket.IO presence, per-room authorization token, reconnect grace period, and live lobby updates.
1. Add signed per-player session tokens, disconnect handling, and a reconnect grace period to the Socket.IO lobby.
1. Add PostgreSQL and Prisma snapshots/event log. Move room persistence out of memory.
1. Complete the domain: character selection, card dealing, board graph, movement, suggestions, disprovals, accusations, and end states.
1. Implement game-board views from `docs/cluedo.pdf`, private notebook and card-hand projections.
1. Add Vitest rules coverage, API integration tests with PostgreSQL, and Playwright scenarios for multiple independent browser contexts.

## Verification requirements

Every change must pass `pnpm typecheck`, `pnpm test`, and `pnpm build`. Before release, Playwright must cover create/join, character selection, turns, private-card visibility, suggestions, accusations, reconnection, and mobile/desktop viewports.
