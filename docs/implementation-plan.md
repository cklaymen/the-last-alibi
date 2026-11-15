> **Historical document.** The current implementation plan is [`game-screens-plan.md`](game-screens-plan.md); binding game rules are in [`cluedo-rules.md`](cluedo-rules.md).

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

---

### Milestone A — Infrastructure hardening

- [ ] Signed per-player session tokens (JWT or opaque, issued on room join); replace nickname-only auth in all socket handlers
- [ ] Disconnect handling: 30 s grace period before removing player; `player:reconnected` event re-hydrates client state from server snapshot
- [ ] PostgreSQL + Prisma: persist rooms and game snapshots; event log table for replay and audit
- [ ] API integration tests against real PostgreSQL (Docker Compose fixture)

---

### Milestone B — Game domain: board & cards

**`packages/game/src/board.ts`**

- [x] Define the board as a constant 2D grid; `Cell` type = `"wall" | "corridor" | "door" | "room" | "start"`
- [x] Assign `RoomId` to each region: `kitchen | ballroom | conservatory | billiard_room | library | study | hall | lounge | dining_room`
- [x] Mark per-character starting cells (6 cells around board edge)
- [x] Model secret passages: `Kitchen↔Study`, `Conservatory↔Lounge`
- [x] `reachableCells(from, steps, board, occupiedCells)` — BFS returning valid destinations (walls, doors, occupancy respected)
- [x] `roomAt(position)` → `RoomId | null`
- [x] Vitest: movement, door entry, passage, boundary, blocked-path cases

**`packages/game/src/cards.ts`**

- [x] Define `WeaponId`: `candlestick | knife | lead_pipe | revolver | rope | wrench`
- [x] Define `CardId` = `CharacterId | WeaponId | RoomId` (21 total cards)
- [x] `buildDeck()` — returns all 21 cards
- [x] `dealCards(players, rng)` — selects envelope (1 suspect + 1 weapon + 1 room); deals remaining 18 cards as evenly as possible; returns `{ envelope, hands: Map<PlayerId, CardId[]> }`
- [x] Vitest: all 21 cards accounted for; envelope never in any hand; uneven deal distributes correctly

**`packages/game/src/types.ts`** additions

- [x] `BoardPosition { row: number; col: number }`
- [x] `WeaponId`, `CardId`, `RoomId`
- [x] `CharacterToken { characterId: CharacterId; position: BoardPosition }`
- [x] `WeaponToken { weaponId: WeaponId; roomId: RoomId }`
- [x] `Suggestion { suspect: CharacterId; weapon: WeaponId; room: RoomId }`
- [x] `TurnPhase`: `"ROLL" | "MOVE" | "ACTION" | "SUGGEST_PENDING_DISPROVE" | "DONE"`
- [x] `Turn { playerId: PlayerId; phase: TurnPhase; diceRoll?: [number, number]; remainingMoves?: number; suggestion?: Suggestion; disproveQueue?: PlayerId[] }`
- [x] `InProgressGame extends Game` with `turn`, `turnOrder: PlayerId[]`, `characterTokens: CharacterToken[]`, `weaponTokens: WeaponToken[]`, `envelope` (server-only), `eliminatedPlayers: PlayerId[]`, `playerHands: Map<PlayerId, CardId[]>` (server-only)

**`packages/game/src/turn.ts`**

- [x] `startGame(game, playerOrder, rng)` — places characters on start cells; places weapons in random rooms; deals cards; initialises first `Turn` with `phase = "ROLL"`
- [x] `rollDice(game, playerId, rng)` — validates it's this player's `ROLL` phase; returns `[d1, d2]`; sets `remainingMoves = d1+d2`; advances to `MOVE`
- [x] `moveCharacter(game, playerId, to)` — validates `to ∈ reachableCells`; updates `CharacterToken`; destination is a room → `ACTION`, otherwise → `DONE`
- [x] `useSecretPassage(game, playerId)` — validates in passage room during `ACTION`; teleports token to opposite room; stays in `ACTION`
- [x] `makeSuggestion(game, playerId, suspect, weapon)` — validates player is in a room; moves suspected character token and weapon to that room; builds `disproveQueue` (clockwise from suggester, excluding eliminated); phase → `SUGGEST_PENDING_DISPROVE`
- [x] `disproveOrPass(game, playerId, cardId?)` — `cardId` provided: validate player holds it and it matches suggestion; record disproval privately; advance queue or resolve to `DONE`; `undefined`: player passes; advance queue
- [x] `makeAccusation(game, playerId, suspect, weapon, room)` — compare to envelope; correct → `phase = "FINISHED"`, set winner; incorrect → mark eliminated; all active players gone → `phase = "FINISHED"`
- [x] `endTurn(game, playerId)` — advance to next non-eliminated player in `turnOrder`; new `Turn` with `phase = "ROLL"`
- [x] Vitest: full turn lifecycle, elimination chain, correct/wrong accusation, passage use, suggestion with nobody holding matching cards

---

### Milestone C — API: game gateway & private projections

**`packages/contracts/src/index.ts`** additions

- [ ] `boardPositionSchema`, `characterTokenSchema`, `weaponTokenSchema`
- [ ] `publicGameStateSchema` — board tokens, weapon locations, turn info; **no** envelope, **no** hands
- [ ] `privateHandSchema` — `{ playerId, cards: CardId[] }` — emitted only to the card-holder's socket
- [ ] `disproveRevealSchema` — `{ cardId: CardId }` — emitted only to the suggester
- [ ] `disproveRequestSchema` — `{ suggestion: Suggestion }` — emitted only to the next disprover
- [ ] Action schemas: `rollSchema`, `moveSchema`, `passageSchema`, `suggestSchema`, `accuseSchema`, `disproveSchema`

**`apps/api/src/game/`** (new NestJS module)

- [ ] `GameService` — wraps `packages/game` turn functions; stores `InProgressGame` keyed by room code
- [ ] `GameGateway` — `@SubscribeMessage` handlers: `turn:roll`, `turn:move`, `turn:passage`, `turn:suggest`, `turn:accuse`, `turn:disprove`, `turn:pass`
- [ ] On `startGame`: broadcast `game:state` (public) to all; emit `game:hand` privately to each player via their socket ID
- [ ] After `makeSuggestion`: emit `game:disprove_request` only to first player in disprove queue
- [ ] After `disproveOrPass` with a card: emit `game:disproved_card` only to the suggester
- [ ] After every state change: broadcast `game:state` (public projection, no private data) to all in room
- [ ] On reconnect: re-emit `game:state` + `game:hand` to returning socket
- [ ] `AppModule` registers `GameModule`; `RoomsService.start()` delegates to `GameService.startGame()`

---

### Milestone D — Web: board view & game UI

**`apps/web/src/ui/GameView.tsx`**

- [ ] Shown when `room.phase === "IN_PROGRESS"`; replaces lobby view
- [ ] Subscribes to `game:state`, `game:hand`, `game:disprove_request`, `game:disproved_card`
- [ ] Layout: `<Board>` + `<TurnPanel>` + side panel with `<CardHand>` + `<Notebook>`

**`apps/web/src/ui/Board.tsx`**

- [ ] Renders the board grid as SVG or CSS grid; cells coloured by type
- [ ] Room name labels inside room regions
- [ ] Character tokens as coloured circles at their current `BoardPosition`
- [ ] Weapon tokens as small icons inside room cells
- [ ] During active player's `MOVE` phase: highlights reachable cells; click emits `turn:move`
- [ ] Secret passage button when player is in a passage room during `ACTION`; click emits `turn:passage`

**`apps/web/src/ui/TurnPanel.tsx`**

- [ ] Rendered only to the active player; others see "Waiting for [name]…"
- [ ] `ROLL` phase: "Roll dice" button; shows `[d1, d2]` result
- [ ] `ACTION` phase: "Make suggestion", "Make accusation", "End turn"
- [ ] Suggestion modal: suspect selector + weapon selector; current room shown as implicit
- [ ] Accusation modal: suspect + weapon + room selectors; warning about elimination on wrong guess

**`apps/web/src/ui/DisprovePanel.tsx`**

- [ ] Modal shown when `game:disprove_request` is received
- [ ] Lists matching held cards as buttons; "Pass" if none match
- [ ] On select: emits `turn:disprove { cardId }`; on pass: emits `turn:disprove` with no card

**`apps/web/src/ui/CardHand.tsx`**

- [ ] Displays private cards grouped by type (suspects, weapons, rooms)
- [ ] Never visible to other players (private socket projection only)

**`apps/web/src/ui/Notebook.tsx`**

- [ ] 3-section grid: suspects, weapons, rooms — one row per card
- [ ] Each cell cycles: blank → ✓ (seen/innocent) → ✗ (eliminated)
- [ ] Cards in own hand pre-marked ✓ when `game:hand` arrives
- [ ] State is local; no server sync needed

**`apps/web/src/ui/GameOverScreen.tsx`**

- [ ] Shows winner name and envelope contents (suspect + weapon + room)
- [ ] Win/loss message for current player; "Return home" button

**`apps/web/src/i18n/index.ts`** additions

- [ ] All game-phase strings: dice, move prompt, suggestion/accusation forms, disprove prompt, win/loss/elimination messages
- [ ] All room names and weapon names sourced from `t()`

---

### Milestone E — Testing & polish

- [ ] Vitest: single-player disprove queue, all-wrong-accusation chain, passage use, uneven hand sizes
- [ ] Playwright: full two-player game — lobby → character select → start → roll → move → suggestion → disprove → correct accusation → game over
- [ ] Playwright: wrong accusation eliminates player; remaining players continue; winner declared
- [ ] Playwright: reconnect mid-game — board state and private hand restored
- [ ] Playwright: mobile viewport (375 × 812) — board scrollable, panels stacked
- [ ] Playwright: desktop viewport (1440 × 900) — board and side panel side-by-side
- [ ] Original presentation assets: character portraits, room illustrations, weapon icons

---

**Architecture decisions**

- `envelope` and `playerHands` are server-internal only; never sent in any broadcast
- Only the suggester sees which card was shown to them, via private `game:disproved_card` emit
- Dice roll is generated server-side (authoritative RNG); result broadcast after the fact
- The detective notebook is local UI state; no server sync required
- `InProgressGame` extends `Game` so lobby logic stays unchanged
