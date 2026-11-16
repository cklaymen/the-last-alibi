# Documentation – The Last Alibi

Reference documentation of the **current state** of the application: what it offers, how the game works, which decisions were made and why, and how it is built. It describes what *is*, not what is planned – the backlog lives only in [`todo.md`](todo.md).

## Map

| Document | Answers | Read when |
|---|---|---|
| [`product/overview.md`](product/overview.md) | What is the product, for whom, what is out of scope, glossary | Always first |
| [`product/features.md`](product/features.md) | Everything the app does today, screen by screen (functional requirements, `FR-*` ids) | Changing or testing any behaviour |
| [`product/game-rules.md`](product/game-rules.md) | Game rules; the **"Implementation clarifications"** section is binding | Touching `packages/game` or anything rule-related |
| [`product/decisions.md`](product/decisions.md) | Product / rule decisions and deviations from the rulebook, with reasons (`PD-*`) | Before "fixing" something that looks like a deviation |
| [`technical/architecture.md`](technical/architecture.md) | Layers, modules, data flow, privacy, timers, presence, technical requirements | Before larger code work |
| [`technical/protocol.md`](technical/protocol.md) | HTTP endpoints, socket commands/events, state shapes, error codes, test API | Changing contracts, API or client communication |
| [`technical/adr.md`](technical/adr.md) | Architecture decision records with context and consequences (`ADR-*`) | Before changing a structural choice |
| [`technical/testing.md`](technical/testing.md) | Test levels, Definition of Done, scenario API, e2e conventions | Writing tests, finishing a task |
| [`todo.md`](todo.md) | Open backlog / requirements of the current batch (in Polish) | Planning new work |
| `todo-plan.md` | Agent task plan of the current batch – exists only while a batch is being implemented | Implementing a planned task |
| [`history/`](history/) | Completed batches (`NN-<topic>/todo.md` + `plan.md`) – **not current** | Archaeology only |

## Sources of truth

When documents and code disagree, the order is:

1. **Code + tests** (the behaviour that ships).
2. `product/game-rules.md` → "Implementation clarifications" (binding rule spec; code must follow it – a mismatch is a bug in one of them).
3. The other documents in this folder.
4. `history/` – never authoritative.

Exact values (option lists, defaults, limits) are defined once in code; documents quote them and name the constant, e.g. `DEFAULT_ROOM_SETTINGS` in `packages/game/src/shared/types.ts`.

## Work lifecycle (todo → plan → docs → history)

1. **Requirements** – new work is written in `docs/todo.md` (Polish), as numbered items with decisions.
2. **Plan (optional)** – for a bigger batch, split it into agent tasks in `docs/todo-plan.md` (template: [`history/03-house-rules-and-game-ux/plan.md`](history/03-house-rules-and-game-ux/plan.md)). The **last task of every plan is the documentation update** (step 4), depending on all other tasks.
3. **Implement** – tick `[x]` in `todo.md` / `todo-plan.md` while working.
4. **Update the docs** – before a batch counts as done, describe the result in the current docs, following the map below. Write the state, not the change history ("the notebook has …", not "we added …"):

   | What changed | Update |
   |---|---|
   | Anything visible or behavioural | `product/features.md` – extend the right section; new `FR-*` ids |
   | A rule, a host option, a default | `product/game-rules.md` → Implementation clarifications; settings table in `features.md` §4.1 |
   | A choice between alternatives, a deviation from the rulebook, a "won't do" | `product/decisions.md` – new `PD-*` |
   | Socket command, event, state field, error code, endpoint, scenario field | `technical/protocol.md` |
   | New module, pattern, dependency, layer rule, infrastructure | `technical/architecture.md`; a structural choice also gets an `ADR-*` in `technical/adr.md` |
   | Test approach, new hot spot, DoD | `technical/testing.md` |
   | Scope of the product | `product/overview.md` |
   | Run/deploy/env vars | root `README.md` + `architecture.md` §7 |

5. **Archive** – when every item is done: move `todo.md` (the done part) and `todo-plan.md` into a new folder `history/NN-<short-topic>/` as `todo.md` and `plan.md` (next number), add the archive banner, add a row to [`history/README.md`](history/README.md) (date, last commit, where it is now described), and leave `docs/todo.md` with only the items that are still open.

Small changes outside a batch skip steps 1–2 and 5, but step 4 always applies, in the same commit as the code.

## Maintaining these docs

- **Language:** English. Exception: `todo.md` and archived `history/*/todo.md` are in Polish.
- **Do not keep ticked items in `todo.md`** after the batch is archived; their substance lives in the docs above.
- **Stable ids** (`FR-LOBBY-3`, `PD-4`, `ADR-7`) may be referenced from code comments, commits and plans. Never renumber; append new ids, mark removed ones as *superseded*.
- **New rule or option** → update `game-rules.md` (clarifications), `features.md` (settings table) and, if it deviates from the rulebook, `decisions.md`.
- **New socket command, event, error code or state field** → update `protocol.md`.
- **New structural pattern / dependency / layer rule** → add an ADR.
- Keep each fact in one place and link to it instead of copying.
