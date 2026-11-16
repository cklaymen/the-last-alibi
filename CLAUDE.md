# CLAUDE.md

Online deduction board game ("The Last Alibi") for 2–6 players: pnpm/Turborepo monorepo, TypeScript strict, NestJS + Socket.IO API, React 19 + Vite + Tailwind 4 web, Vitest, Playwright.

- Talk to the user in **Polish**. Write code, comments, commit messages and docs in **English**. Exception: `docs/todo.md` is in Polish.
- Read before larger work: `docs/game-screens-plan.md` §2 Architecture, §3 Testing, §4 Definition of Done. Game rules: `docs/cluedo-rules.md` (the "Implementation clarifications" section is binding). Current backlog: `docs/todo.md`, broken into agent tasks in `docs/todo-implementation-plan.md`.

## Commands

```bash
pnpm install
pnpm --filter @mystery-game/game --filter @mystery-game/contracts build   # needed before api/web/e2e/lint
pnpm lint          # ESLint: layer + feature boundaries (eslint.config.mjs)
pnpm typecheck
pnpm test          # Vitest: game, api, web
pnpm build
pnpm test:e2e      # Playwright, starts API :3100 + web :5174 (first run: pnpm --filter @mystery-game/e2e exec playwright install chromium)
```
Single package / file: `pnpm --filter @mystery-game/<game|contracts|api|web> test -- <pattern>`.
**Done = `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e` all green.** Report failures with their output; never claim success without running them.

## Architecture (enforced by `pnpm lint`)

```
packages/game        pure domain rules        ← the only source of game rules
packages/contracts   Zod schemas + types      (imports ids from game)
apps/api             transport, sessions, presence, projections, timers
apps/web             views; renders only what the server allows
apps/e2e             black-box Playwright (may import only contracts)
```
- **Server is authoritative.** The web never validates moves or decides visibility. Allowed buttons come from `me.availableActions`, reachable cells from `me.reachable`. The web may import only **static data** from `@mystery-game/game` (ids, board layout, option lists) and types; lint enforces a whitelist in `eslint.config.mjs`.
- **Feature folders** in every layer (`packages/game/src/<module>`, `apps/api/src/modules/<module>`, `apps/web/src/features/<feature>`). Import another feature/module **only through its `index.ts`** (exception: `game/src/board/layout.ts`). Tests may import fixtures/i18n from other web features.
- **Domain**: pure, immutable functions returning `GameResult` (`ok(game)` / `fail(code)`), no exceptions. Randomness via injected `Rng`, time via injected `Clock`/`Timer`. No `Math.random()`, `Date.now()` or `setTimeout` in logic.
- **Error codes, not texts.** A new `GameErrorCode` must also be added to `packages/contracts/src/errors.ts` and translated (EN+PL) in `apps/web/src/shared/errors/i18n.ts`.
- **Projections**: `GameProjector` is the only place deciding visibility. The envelope, hands, shown cards and room cards never go into public state or events. When you add private data, add an API test proving another player's socket never receives it.
- **API**: new socket command = new `commands/<name>.handler.ts` + one entry in `commands/index.ts` (append-only). Commands use ack (`CommandResult`), and state is pushed via `game:state` / `game:private`. Identity comes from the handshake token, never from the payload.
- **Web**: game state lives in React context with pure selectors (no Redux, no router lib). Turn actions use the registry in `features/turn/actions.ts`. Shared card UI: `CardTile`, `CardSelectGrid`.

## Conventions

- **i18n**: every UI string goes in `features/<x>/i18n.ts` with `en` and `pl` (`pl` typed by `en`).
- **Styles**: Tailwind with CSS tokens from `apps/web/src/styles.css` only. A new colour means a token defined in both light and dark themes. Animations go only under `prefers-reduced-motion: no-preference`.
- **Accessibility**: interactive elements need a role and accessible name. Playwright uses `getByRole`/`getByLabel` with EN names; `data-testid` only as a last resort.
- **`localStorage`**: always wrapped in try/catch, and the app must work when storage throws.
- **Tests**: TDD. Domain changes need Vitest tests per rule in `packages/game/test` (helpers in `test/helpers.ts`: `started`, `withState`, `unwrap`, `codeOf`, `diceRng`). API tests use `@nestjs/testing` + `socket.io-client`. UI changes need a Playwright spec. Use the test scenario API (`POST /testing/rooms/:code/scenario`, `ENABLE_TEST_API=1`) to set hands, pawns, dice and the active player.
- Keep files small and focused. Follow existing patterns; no new dependencies without a reason stated in the commit.

## Working on plan tasks (agents)

- One task = one worktree + branch `todo/<ID>-<short-name>` off the current `main`. Do only that task. If you need to change a file owned by another task (see "Hot files" in the plan) beyond appending, stop and report.
- Steps: read the task + Global Constraints + Review Focus → failing test → implement → green → run the full Done commands → tick `[x]` in `docs/todo-implementation-plan.md` (and the item in `docs/todo.md`) → commit.
- Hot files are append-only, and merge conflicts in them are resolved by keeping both entries: `apps/api/src/modules/game/commands/index.ts`, `apps/api/src/modules/testing/scenario.ts`, `packages/contracts/src/testing/index.ts`, `packages/game/src/index.ts`, `apps/web/src/features/game/ActionSection.tsx`, `apps/e2e/pages/GamePage.ts`.
- Commit messages: Conventional Commits (`feat(scope): …`, `fix: …`, `docs: …`). Commit only when the task asks or the user says so; never push without being asked.

## Gotchas

- `@mystery-game/game` and `contracts` are consumed from `dist/`. Rebuild them after changing them, otherwise api/web/lint see stale code.
- The API keeps all state in memory: restarting it wipes rooms.
- Presence: `PRESENCE_GRACE_MS` defaults to 30 s (`DEFAULT_GRACE_MS`). After it, a player leaves the lobby, or in a game becomes "away" (turns skipped, cards shown automatically).
