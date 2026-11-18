# Architecture decision records

Short ADRs: **Context → Decision → Consequences**. Status is *Accepted* unless noted. Ids are stable; to change a decision add a new ADR that supersedes the old one and mark the old one *Superseded by ADR-n*.

---

### ADR-1 – Monorepo with a pure domain package
**Context:** rules must be shared by the server and be testable without infrastructure.
**Decision:** pnpm + Turborepo monorepo; game rules in `packages/game` as plain TypeScript with zero runtime dependencies; `packages/contracts` for wire schemas; `apps/api`, `apps/web`, `apps/e2e`.
**Consequences:** one place for rules; fast unit tests; `game` and `contracts` must be built to `dist/` before dependants see changes.

### ADR-2 – Authoritative server, intent-only client
**Context:** an online hidden-information game; any client-side rule or visibility decision can be cheated or diverge.
**Decision:** the client sends intents; the server validates with `packages/game` and pushes state. Allowed actions (`availableActions`) and reachable targets (`reachable`) are computed by the domain and sent privately. The web never calls rule functions (lint-enforced whitelist: static data + types only).
**Consequences:** zero rule duplication in the UI; every UI affordance needs a server field; latency of one round trip per action (acceptable for a turn-based game).

### ADR-3 – Pure, immutable domain returning `Result`
**Context:** deterministic, easily testable rules; no hidden control flow.
**Decision:** every domain function is `(game, …) → { ok: true, game } | { ok: false, code }`; no exceptions, no mutation; randomness via injected `Rng`; time is never read in the domain – the API owns clocks and timers (injected `Clock`/`Timer`).
**Consequences:** tests use `diceRng`/fixed RNG and fake clocks; the API maps failures to error codes.

### ADR-4 – Error codes instead of messages
**Context:** the UI is bilingual; server texts cannot be translated.
**Decision:** domain `GameErrorCode` union → `errorCodes` in contracts → translated in the web. The server never sends UI text.
**Consequences:** adding an error touches three files (domain, contracts, web i18n); TypeScript keeps them in sync.

### ADR-5 – One projector decides visibility
**Context:** leaks of private cards are the worst possible bug.
**Decision:** `GameProjector` is the only code that builds public (`game:state`) and private (`game:private`) views. Domain events are designed to be public (never carry hidden card ids). New private data requires an API test asserting another player's socket never receives it.
**Consequences:** privacy reviews focus on one file plus event types.

### ADR-6 – Socket commands with ack + state pushes
**Context:** clients need immediate success/failure feedback, but all players need the resulting state.
**Decision:** each command is a Socket.IO emit with an ack (`CommandResult`); resulting state is broadcast separately (`room:state`, `game:state`, `game:private`). Commands are a registry of handlers (`commands/<name>.handler.ts` + append-only `commands/index.ts`).
**Consequences:** open/closed – new commands don't modify existing ones; clients have a single state-update path.

### ADR-7 – Identity from an opaque session token
**Context:** initially identity was the nickname, letting anyone impersonate another player.
**Decision:** create/join issue an opaque UUID token; the socket authenticates in the handshake; payloads never contain identity; host recognised by `hostId`. Tokens are stored per room in `sessionStorage` with a `localStorage` fallback.
**Consequences:** refresh-safe sessions, multiple players per browser (one per tab); no expiry (in-memory, wiped on restart).

### ADR-8 – In-memory repositories behind interfaces
**Context:** small private games; persistence was not required for the first release.
**Decision:** `GameRepository` and `SessionRepository` are interfaces with in-memory implementations.
**Consequences:** restarting the API wipes all rooms (documented); a database can be added later without touching services (see `todo.md`).

### ADR-9 – Feature folders with enforced boundaries
**Context:** parallel work by several agents/developers caused coupling and merge conflicts.
**Decision:** every layer is split into feature folders/modules whose public API is `index.ts`; `eslint-plugin-boundaries` enforces layer direction and feature boundaries. A set of "hot" registry files is append-only.
**Consequences:** cross-feature imports go through `index.ts`; conflicts in hot files are resolved by keeping both entries.

### ADR-10 – React context + pure selectors, no Redux, no router library
**Context:** state is server-owned; the client only holds the latest projections.
**Decision:** `SessionProvider` and `GameProvider` in React context; derivations in pure `selectors.ts`; a tiny History-API router with two routes.
**Consequences:** minimal dependencies; selectors are unit-tested in isolation.

### ADR-11 – Contract-first changes
**Context:** a batch of features (house rules, timers, room cards, notebook) had to be built in parallel.
**Decision:** add all new types, settings, error codes, events and projection fields to contracts/domain first (with neutral placeholders), then implement behaviour per feature.
**Consequences:** hot files are touched once; later work stays inside feature folders. Recommended for future multi-task batches.

### ADR-12 – Turn clock in the API with turn keys
**Context:** timeouts can race with player actions (the turn may already have changed when a timer fires).
**Decision:** `TurnClock` keeps countdowns per room keyed by the current turn (and suggestion); every expiry re-checks `isCurrent(key)` and is a no-op when stale. The turn countdown pauses during a disproof. The timeout itself is a pure domain function (`timeOutTurn`, `autoDisprove`).
**Consequences:** no timer logic in the domain; race-safety is tested with fake timers.

### ADR-13 – One commit pipeline for every state change
**Context:** state changes come from commands, timers and presence; they must be handled identically.
**Decision:** `GameService.commit` always runs settle (`resolveAway`, auto return to lobby) → save → `TurnClock.sync` → publish.
**Consequences:** away handling and timers can't be bypassed by a new command.

### ADR-14 – Notebook deduction on the client, from public facts only
**Context:** automatic notes need the player's private knowledge (hand, seen cards) plus public history; the server should not hold UI-level derived data.
**Decision:** a pure `deduce()` in `web/features/notebook` computes marks from the full event log and the player's private state; only manual marks are persisted (`localStorage`). The server sends the full event history (no window).
**Consequences:** consistent results across refreshes/devices; deduction is unit-testable; it is "advice", not a rule, so it lives in the web without violating ADR-2.

### ADR-15 – CSS tokens and Tailwind; themes via `data-theme`
**Context:** light/dark themes with AA contrast and no hardcoded colours.
**Decision:** all colours are CSS custom properties in `apps/web/src/styles.css`, defined for both themes; Tailwind utilities reference tokens; `data-theme` on `<html>` is set before paint.
**Consequences:** a new colour = a new token in both themes.

### ADR-16 – Build-time version without git in the image
**Context:** testers need to identify a build; `.git` is excluded from the Docker context.
**Decision:** Vite `define` injects `__APP_VERSION__` = UTC build time (+ optional `GIT_SHA` build arg); `dev` locally.
**Consequences:** to show the hash run `GIT_SHA=$(git rev-parse --short HEAD) docker compose build`.

### ADR-17 – Black-box e2e with a test-only scenario API
**Context:** e2e tests need deterministic hands, dice and positions without reaching into server internals.
**Decision:** Playwright tests import only contracts; deterministic setup through `POST /testing/rooms/:code/scenario`, enabled only by `ENABLE_TEST_API=1`.
**Consequences:** the scenario schema grows append-only with each feature; it must never be enabled in production.

### ADR-18 – Continuous deployment through a self-hosted runner
**Context:** the app runs on the owner's own server behind a Cloudflare Tunnel (no inbound ports); a push to `main` should rebuild and restart it. The repository is public.
**Decision:** GitHub Actions: checks on GitHub-hosted runners, then `docker compose up -d --build` on a self-hosted runner on the server. Fork PR workflows require approval for all external contributors. Rejected: a server-side polling timer (equally safe, but no deploy history/logs in GitHub) and an inbound webhook (needs an exposed endpoint).
**Consequences:** the runner user is in the `docker` group (root-equivalent), so foreign PR workflow runs must never be approved. Each deploy restarts the API and drops in-memory games.
