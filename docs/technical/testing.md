# Testing and Definition of Done

## Commands

```bash
pnpm install
pnpm --filter @mystery-game/game --filter @mystery-game/contracts build   # before api/web/e2e/lint
pnpm lint          # ESLint: layer + feature boundaries
pnpm typecheck
pnpm test          # Vitest: game, api, web
pnpm build
pnpm test:e2e      # Playwright; starts API :3100 + web :5174
```

Single package/file: `pnpm --filter @mystery-game/<game|contracts|api|web> test -- <pattern>`.
First e2e run: `pnpm --filter @mystery-game/e2e exec playwright install chromium`. Ports can be changed with `E2E_API_PORT` / `E2E_WEB_PORT`.

## Definition of Done

A change is done when:
1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e` are all green (report failures with output; never claim success without running them).
2. New UI text exists in EN and PL; new colours are tokens in both themes; it works on both viewports and both themes.
3. No boundary violations, no rule duplication in the UI.
4. Docs in `docs/` updated where behaviour, rules, contracts or decisions changed (see [`../README.md`](../README.md#maintaining-these-docs)).

## Test levels

| Level | Tool | Location | What | Required for |
|---|---|---|---|---|
| Domain | Vitest | `packages/game/test/<module>.test.ts` | Every rule and edge case, deterministic `Rng` | Every domain change (TDD, one test per rule) |
| API | Vitest + `@nestjs/testing` + `socket.io-client` | `apps/api/test` | Commands, authorization, timers (fake clock/timer), presence, **no private-data leakage** (record every event a third socket receives) | Every API change; every new private field |
| Web | Vitest + Testing Library + jsdom | next to the code (`*.test.ts(x)`) | Pure selectors, deduction, notebook model, complex components, i18n key completeness | Logic in components/selectors |
| E2E | Playwright | `apps/e2e/tests/<feature>.spec.ts` | User scenarios with several browser contexts | Every UI change |

Domain test helpers (`packages/game/test/helpers.ts`): `started`, `withState`, `unwrap`, `codeOf`, `diceRng`.

## E2E conventions

- Projects: `mobile-chromium` (iPhone 13) and `desktop-chromium` (1440×900); some layout tests use 360×780.
- Fixtures create N players in one room (separate browser contexts); Page Objects in `apps/e2e/pages` (`GamePage.ts` is append-only).
- Select with `getByRole` / `getByLabel` using **EN** names (tests run in `en-US`); `data-testid` only as a last resort.
- Deterministic setup via the scenario API ([`protocol.md` §6](protocol.md#6-test-scenario-api)): hands, envelope, pawns, weapons, dice queue, active player, summoned players, room cards, settings, shortened time limits.
- Privacy checks also assert that private text is **absent** from other players' DOM.
- E2E may import only `@mystery-game/contracts`.

## Current suites

Domain: `accusation`, `board`, `lobby`, `movement`, `presence`, `room-cards`, `settings`, `setup`, `suggestion`, `time-limits`, `turn-flow`.
E2E: `accusation`, `board`, `dialogs`, `game-start`, `layout`, `lobby`, `notebook`, `preferences`, `presence`, `room-access`, `room-cards`, `settings`, `suggestion`, `timer`, `turn`.

## Areas that need extra care (regression hot spots)

1. A summoned player must not both suggest and move in the same turn (either order).
2. Timer races: a stale timeout (turn changed, game ended, room deleted) is a no-op; the turn timer pauses – not resets – during a disproof.
3. Room card ids must never reach players who have not stood in that room, nor public state/events.
4. Deduction uses facts only, terminates, and manual marks always win in display.
5. The notebook with 5 other players fits 360 px without horizontal page scroll.
