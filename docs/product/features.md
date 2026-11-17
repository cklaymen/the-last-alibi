# Features – what the application offers

Functional reference of the current application, grouped by screen. Each requirement has a stable id (`FR-<AREA>-<n>`). Rule details are in [`game-rules.md`](game-rules.md); reasons behind choices in [`decisions.md`](decisions.md); wire-level details in [`../technical/protocol.md`](../technical/protocol.md).

Code locations are given as hints (`feature folder` or file) so a reader – human or AI – can jump to the implementation.

---

## 1. Global (every screen)

| Id | Requirement | Where |
|---|---|---|
| FR-APP-1 | Two URLs only: `/` (home) and `/room/<code>` (room). History API router, no routing library. | `web/shared/lib/router` |
| FR-APP-2 | Header with the rules button (FR-APP-8), theme switch (**Light / Dark / System**, default System), language switch (**EN / PL**, default from `navigator.language`), and – inside a room – the nickname button. | `web/app/AppHeader.tsx`, `features/theme`, `features/locale`, `features/nickname` |
| FR-APP-3 | Theme choice is stored in `localStorage` (`theme`) and applied before first paint by an inline script in `index.html` (no flash). The user's choice overrides the system preference. | `features/theme` |
| FR-APP-4 | Language is stored in `localStorage`; `<html lang>` follows it. All UI text exists in EN and PL. | `features/locale`, per-feature `i18n.ts` |
| FR-APP-5 | Server errors arrive as codes and are shown translated (EN/PL). | `web/shared/errors` |
| FR-APP-6 | The app keeps working when `localStorage`/`sessionStorage` throws (private mode etc.); only persistence is lost. | `web/shared/lib/storage.ts` and every store |
| FR-APP-7 | Animations run only under `prefers-reduced-motion: no-preference`; otherwise static colours/borders remain. | `web/src/styles.css` |
| FR-APP-8 | **Rules** button in the header (every screen) opens "How to play": five one-line base rules, then "In this room" lines generated from the current room settings, each marked with a "Room setting" chip. Outside a room one line says the host can change some rules. | `features/rules-help` (`rulesItems.ts`) |
| FR-APP-9 | **One tooltip behaviour** in the HTML UI (`shared/ui/Tooltip.tsx`): hover shows / leave hides (mouse), click or tap pins it, a second click, `Escape` or a press outside closes it; the bubble is linked with `aria-describedby`. Used by the Cards table headers and hand marker and by the room-setting explanations; the board's SVG tooltips follow the same rules. | `web/shared/ui/Tooltip.tsx` |

## 2. Home screen (join / create)

| Id | Requirement |
|---|---|
| FR-HOME-1 | Enter a nickname (2–24 characters, trimmed) and **Create room** – the server generates a 6-digit code and makes you host. |
| FR-HOME-2 | Or enter a **room code** (4–6 digits, digits-only input) and **Join room**. |
| FR-HOME-3 | The last nickname is remembered in `localStorage` (`nickname`) and pre-filled. |
| FR-HOME-4 | Opening a room link `/room/<code>` without a session shows "Join room {code}" (nickname only) with a "Create a new room instead" option. A malformed or unknown code reports `ROOM_NOT_FOUND`. |
| FR-HOME-5 | Joining is refused when the room is full (`GAME_FULL`, max 6), the game already runs (`GAME_NOT_IN_LOBBY`) or the nickname is taken in that room (`NAME_TAKEN`, case-insensitive; the same nickname in another room is fine). |
| FR-HOME-6 | The footer shows the **build version**: UTC build time `YYYY-MM-DDTHH:MMZ`, optionally followed by the short commit hash (`2026-11-16T14:32Z (13c8392)`); `dev` when running `pnpm dev`. Computed at build time (`__APP_VERSION__` in `apps/web/vite.config.ts`, `GIT_SHA` build arg in Docker). |

## 3. Session and reconnection

| Id | Requirement |
|---|---|
| FR-SES-1 | Creating/joining returns a **session token**; it identifies the player for every request and socket connection. Nicknames are never identity. |
| FR-SES-2 | The session is stored per room code in `sessionStorage` (this tab) with a `localStorage` fallback, so a refresh – or reopening the link after closing the tab – restores the player, their character, hand and notebook. Two tabs in the same browser can be two different players. |
| FR-SES-3 | A fresh tab at `/` does not silently adopt another tab's room (the "last room" pointer is tab-only). |
| FR-SES-4 | While the socket reconnects the lobby shows "Reconnecting…"; after reconnecting the server pushes the full current state. |
| FR-SES-5 | **Change nickname** inside a room (header button → dialog); duplicates in the room are rejected. |
| FR-SES-6 | **Leave room** (lobby) forgets the session in this browser and returns home. |

## 4. Lobby

| Id | Requirement |
|---|---|
| FR-LOBBY-1 | Shows the room code / link, the player list with host badge, "(you)", chosen character and presence (offline). |
| FR-LOBBY-2 | **Character picker**: six character cards; available / selected / taken states. A character can be changed until the game starts; a taken one is rejected (`CHARACTER_TAKEN`). |
| FR-LOBBY-3 | **Start game** (host only) is enabled with ≥ 2 players who have all chosen a character; others see "Waiting for host" and a hint. |
| FR-LOBBY-4 | The host can **remove a player** (not themselves). The removed player's sockets get `room:kicked` and are disconnected. |
| FR-LOBBY-5 | **Room settings panel**: the host edits, everyone else sees the values read-only. Every setting has an info button ("About: {setting}") with a one- or two-sentence explanation of its effect in play, available to everyone (also when the controls are disabled). Changes are allowed only in the lobby (`GAME_NOT_IN_LOBBY`) and only by the host (`NOT_HOST`). Settings survive returning to the lobby after a game. See §4.1. |
| FR-LOBBY-6 | **Last game** summary after a finished game: winner ("You win!" / "{name} wins!"), "Last detective standing" when won by elimination, and the envelope solution. |
| FR-LOBBY-7 | If the host leaves the lobby (or is removed by the presence timeout), the next player becomes host. When the last player leaves, the room is deleted. |

### 4.1 Room settings (house rules)

Defined in `packages/game/src/shared/types.ts` (`DEFAULT_ROOM_SETTINGS`, option constants). Rule semantics: [`game-rules.md` → Implementation clarifications](game-rules.md#implementation-clarifications-binding-for-this-project).

| Setting (UI label) | Field | Options | Default | Effect |
|---|---|---|---|---|
| Accusation location | `accusationPlace` | `any_room` / `named_room` | `any_room` | Accuse from any room, or only naming the room you stand in (room locked in the dialog). Accusing from a corridor is never allowed. |
| Accuse after suggestion in the same turn | `accuseAfterSuggestion` | on / off | on | Off → after suggesting you must wait for your next turn to accuse. |
| Suggest after staying in a room | `suggestAfterStaying` | on / off | off | On → starting the turn in a room allows suggesting there without moving (instead of moving). |
| Turn time limit | `turnTimeLimitSec` | none / 30 / 60 / 90 / 120 / 180 s | 90 s | Server ends the turn when it runs out. |
| Time to show a card | `disproveTimeLimitSec` | none / 15 / 30 / 45 / 60 s | 30 s | Server shows a random matching card when it runs out. |
| Face-down cards in rooms | `roomCards` | 0–8 | 0 | That many cards are placed face down in different rooms instead of being dealt. |
| Automatic notes | `autoNotes` | on / off | on | Cards-table deductions on/off (facts always shown). |

The controls and explanations live in `web/features/room-settings` (`RoomSettingsView`), shared by the lobby panel and the read-only in-game section (FR-LAYOUT-6).

## 5. Game screen – layout

| Id | Requirement |
|---|---|
| FR-LAYOUT-1 | **Desktop:** board on the left; right column with, in order: action section (sticky at the top), event log, **Cards** (the notebook), **Room settings**. |
| FR-LAYOUT-2 | **Mobile:** board on top, then action section, event log, Cards, Room settings. The action section is a direct child of `<main>` and uses `position: sticky; top: 0; bottom: 0` – it sticks to the bottom while the board fills the screen and to the top after scrolling past it (pure CSS, no scroll listeners). It has its own background and shadow. |
| FR-LAYOUT-3 | Event log, Cards and Room settings are **collapsible** (the first two expanded by default, Room settings collapsed); the state is remembered per browser (`localStorage` `ui:collapsed:<id>`). |
| FR-LAYOUT-4 | Below the board, in one line: the **players bar** (left, scrolls horizontally if needed) and the **map controls** + / − / reset (right, always visible). |
| FR-LAYOUT-5 | With 6 players the whole screen, including the Cards table, fits 360 px width without horizontal page scrolling. |
| FR-LAYOUT-6 | **Room settings** (last section, collapsed by default, `ui:collapsed:settings`): the game's settings, read-only, with the same explanations as in the lobby. |

## 6. Board

| Id | Requirement | Where |
|---|---|---|
| FR-BOARD-1 | Own 24×25 board as inline SVG: 9 rooms with labels, corridors, walls, inaccessible centre, doors (entry only from the corridor square in front), secret-passage markers (kitchen ↔ study, conservatory ↔ lounge), six start squares. | `game/src/board/layout.ts`, `web/features/board` |
| FR-BOARD-2 | All six pawns and six weapons are drawn (room slots or corridor squares); each has an accessible label, e.g. "Ms. Red – Kitchen". | |
| FR-BOARD-3 | **Zoom and pan** (pointer/touch on `viewBox`) with + / − / reset buttons. | `useBoardView.ts` |
| FR-BOARD-4 | **Reachable squares/rooms** (from `me.reachable`) are highlighted and clickable ("Move to row r, column c", "Enter {room}"); clicking moves the pawn. Movement is animated (reduced-motion aware). | |
| FR-BOARD-5 | **My pawn** has a ring; the **active player's pawn** has a distinct (pulsing/accent) highlight. | |
| FR-BOARD-6 | During a suggestion (until the turn ends) the suggested **suspect's pawn** and **weapon** are framed. | `board/selectors.ts` |
| FR-BOARD-7 | **Tooltips** on pawns and weapons: tap/click or long-press (and hover on desktop). Pawn: character name + player nickname if played; weapon: name. A tooltip opens only on a click without drag, so panning, zooming and moving to adjacent squares keep working. The text is clamped to the visible view (also when zoomed) and moves below the token at the top edge (`tooltipAnchor` in `geometry.ts`). | |
| FR-BOARD-8 | Rooms holding a **face-down room card** show a marker ("Face-down card") to everyone. | |

## 7. Players bar

| Id | Requirement |
|---|---|
| FR-PLAYERS-1 | Compact chips in turn order: character avatar + shortened nickname. |
| FR-PLAYERS-2 | Card count, presence (offline / away) and eliminated state as small badges / tooltip; full information in `aria-label`. |
| FR-PLAYERS-3 | The active player is clearly marked (accent frame/background, `aria-current`). |

## 8. Action section

The sticky panel that always says what is going on and what I can do. Components: `TurnPanel` (`features/turn`), `DisprovePanel` + `SuggestionResult` (`features/disprove`), `TimerBar` (`features/timer`), `RoomCardPeek` (`features/room-cards`); composed in `features/game/ActionSection.tsx`.

| Id | Requirement |
|---|---|
| FR-ACT-1 | Shows whose turn it is ("Your turn" / "{name}'s turn") and the latest roll ("You rolled 3 + 4 = 7"). |
| FR-ACT-2 | Buttons appear **only** for actions in `me.availableActions`: **Roll dice**, **Secret passage**, **Suggest**, **Accuse**, **End turn**. After rolling: "Choose where to move on the board." The UI never decides legality itself. Rejected commands show the translated error. |
| FR-ACT-3 | While waiting for a disproof: "Waiting for {name} to show a card…". |
| FR-ACT-4 | **Disprove panel** for the player who must show a card: the suggestion text and a choice among **only the matching cards**; there is no "pass" button (passing is automatic for players without a match). |
| FR-ACT-5 | **Suggestion result** visible to everyone until the turn ends: suggester sees "Nobody could disprove" or "{name} showed you a card:" + the card; others see "Nobody could disprove {name}'s suggestion" or "{by} showed a card to {name}" (never the card). |
| FR-ACT-6 | **Timer bar** attached to the section, visible to all: shows the running countdown – the turn timer, or the disprove timer while someone must show a card (label "Time left for {name}: {s} s"). |
| FR-ACT-7 | **Attention state:** when I must act (my turn with actions, or I must show a card) the section gets an orange-yellow framed highlight with a subtle shimmering animation. In the **last 10 s** (`URGENT_MS`) it additionally pulses red together with the timer. Colours are theme tokens; animation only without reduced motion. |
| FR-ACT-8 | **Room card peek:** when my pawn stands in a room holding a face-down card, the section shows "Face-down card in this room:" with the card (only to me). |
| FR-ACT-9 | An eliminated player sees the banner "You are out – you still have to show cards." |

## 9. Dialogs

| Id | Requirement |
|---|---|
| FR-DLG-1 | **Suggestion dialog:** choose suspect and weapon on card grids; the room is fixed to the current room ("You suggest the room you are in") and shows the same hints as the other cards (FR-DLG-3). |
| FR-DLG-2 | **Accusation dialog:** suspect, weapon, room grids and a warning that a wrong accusation eliminates you. With `named_room` the room is preset to the current room and locked. |
| FR-DLG-3 | In both dialogs each card – including the fixed room of a suggestion – shows hints: "In your hand" chip and my current Cards-table mark (live). Shared component `cards/CardHint.tsx`. |
| FR-DLG-4 | Dialogs are modal with focus handling and Cancel. |

## 10. Event log

| Id | Requirement |
|---|---|
| FR-LOG-1 | Human-readable, translated log of all public events: game start, rolls, moves/room entries, passages, suggestions, "cannot disprove", "X showed a card to Y", "Nobody could disprove", accusations (correct / wrong + elimination), turn end, turn skipped (away), turn timed out, disprove timed out (random card shown), win. |
| FR-LOG-2 | The **full** history is sent by the server (no window) so the log and notebook deductions are identical after refresh or on another device. |
| FR-LOG-3 | The log never contains hidden information (no shown card ids, no room card ids). |
| FR-LOG-4 | Suggestion and accusation entries start with icons of the three named cards (suspect, weapon, room; decorative, `aria-hidden`), followed by the unchanged sentence. |

## 11. Cards (detective notebook)

The section is titled **Cards** (PL "Karty"); code, storage keys and docs still call it the notebook. One table that replaces the former "My cards", "Notebook" and "Seen cards" panels. Code: `web/features/notebook` (`deduction.ts` – pure deduction, `notebookModel.ts` – marks, `notebookStore.ts` – storage).

| Id | Requirement |
|---|---|
| FR-NB-1 | One row per card, in three sections: suspects / weapons / rooms, with icon + name (truncates on narrow screens). |
| FR-NB-2 | Columns: card | **Overall** mark | one narrow column per **other** player in turn order (no column for me). |
| FR-NB-3 | Player column header: dot in the character colour with the nickname's initial; tooltip with the full nickname (FR-APP-9). Eliminated players keep their column (they still disprove), greyed out. |
| FR-NB-4 | **My cards:** distinct background/border, a hand marker ("In hand" chip, only the hand icon when the column is narrow; tooltip "In your hand"), ✓ overall and ✗ in every player column; locked (not editable). |
| FR-NB-5 | Every cell (player × card) and every overall mark cycles on click: **auto → ✓ → ✗ → ? → auto**. "auto" shows the computed value (or nothing). |
| FR-NB-6 | **Manual always wins** over automatic. Automatic marks are rendered lighter, manual ones normal. |
| FR-NB-7 | Only **manual** marks are stored, in `localStorage` per game and player (`notebook:v2:<gameId>:<playerId>`). Automatic marks are recomputed live, never stored. Older notebook formats are ignored (no migration). Open dialogs see changes immediately. |
| FR-NB-8 | "Shown to me": a ✓ in the column of the player who showed me the card, visually emphasised; mentioned in the cell's `aria-label`. |
| FR-NB-9 | **Show player columns** toggle (default on, `localStorage` `notebook:showPlayers`). Off → only card + overall mark. |
| FR-NB-10 | Accessible `<table>` with row/column headers; cell label "card – player – state (automatic/manual)". |
| FR-NB-11 | **Automatic notes** (setting `autoNotes`, default on) – see §11.1. When off: no automatic marks at all (cells, overall, "in envelope"); still shown because they are facts, not deductions: my cards (highlight + lock) and ✓ "shown to me". |

### 11.1 Automatic deduction rules

Pure function `deduce()` in `features/notebook/deduction.ts`. Inputs: full public event history, my hand, cards shown to me, room cards I have seen, every player's card count. **Manual marks are never an input.** Cell values are monotone (a decided cell is never overwritten) and iteration is bounded, so it always terminates.

Base facts:
1. Player X `cannot_disprove` a suggestion → ✗ at X for its three cards.
2. X showed **me** a card → ✓ at X for that card.
3. X showed a card to **someone else** → constraint "X holds at least one of these three cards"; displayed as **?** at X for those cards not already ✗ (no ? once one of them is ✓ at X).
4. My cards and room cards I have seen → ✗ at every other player.

Propagation (until nothing changes):
5. ✓ at one player → ✗ at all other players.
6. Number of ✓ of a player = their card count → ✗ in all their remaining cells.
7. A "?" constraint with only one card not ✗ at X → ✓ at X.
8. **Envelope:** the last card of a section that nobody is known to hold → "in envelope"; also a card with ✗ at every other player and not mine – but only once every face-down room card is known to me (otherwise it could lie in an unvisited room). Envelope cards are ✗ for everyone.

Overall mark (automatic): ✓ when the card is held by someone (✓ at a player, in my hand or a seen room card); the row is highlighted **"in envelope"** per rule 8.

## 12. Gameplay mechanics (summary)

Full rules: [`game-rules.md`](game-rules.md). The domain functions live in `packages/game/src/<module>`.

| Id | Mechanic | Module |
|---|---|---|
| FR-GAME-1 | **Setup:** all 6 pawns on start squares; 6 weapons in 6 random rooms; envelope = 1+1+1 random; optional room cards; remaining cards dealt round-robin (uneven counts possible, 9/9 for 2 players). | `setup`, `room-cards` |
| FR-GAME-2 | **Turn order:** red first if played, then clockwise by `SEAT_ORDER` (red, yellow, white, green, blue, purple), skipping unplayed characters. | `setup` |
| FR-GAME-3 | **Movement:** roll 2 dice on the server, move orthogonally **up to** the total; no passing occupied corridor squares; rooms via doors only; entering a room ends the move; no re-entering the room left this turn. | `movement` |
| FR-GAME-4 | **Secret passage** from a corner room at the start of the turn, instead of rolling. | `movement` |
| FR-GAME-5 | **Suggestion** in the room entered this turn, or the room you were summoned to (or – with `suggestAfterStaying` – the room you started in). One per turn. It **replaces** movement: no roll/move/passage after it. Moves the named pawn and weapon into the room; a moved player becomes *summoned*. | `suggestion` |
| FR-GAME-6 | **Disproving:** clockwise from the suggester, including eliminated players; players without a match pass automatically; the first with a match must show exactly one card of their choice; only the suggester sees it. | `suggestion` |
| FR-GAME-7 | **Accusation:** on your own turn, not while a disproof is pending, only standing in a room; constrained by `accusationPlace` and `accuseAfterSuggestion`. Correct → win. Wrong → eliminated (sees the envelope privately, turn ends, pawn stays, keeps disproving). | `accusation` |
| FR-GAME-8 | **End of game:** correct accusation, or the last non-eliminated player wins automatically. The room returns straight to the lobby with the last-game summary and a new game id. | `accusation`, `lobby` |
| FR-GAME-9 | **End turn** any time during your turn except while a disproof is pending (also without using the full roll). | `turn-flow` |
| FR-GAME-10 | **Room cards:** a player whose pawn has stood in a room with a face-down card this game (by any means) may see it privately; it stays there; never used for disproving; everyone sees which rooms hold one. | `room-cards` |

## 13. Time limits

| Id | Requirement |
|---|---|
| FR-TIME-1 | Turn countdown with the room's `turnTimeLimitSec`; on expiry the server ends the turn (`turn_timed_out`). |
| FR-TIME-2 | While a suggestion waits for a disproof, the turn countdown is **paused** (not reset) and the disprove countdown (`disproveTimeLimitSec`) runs for the disprover; on expiry the server shows a random matching card (`disprove_timed_out` + `card_shown`). The turn countdown then resumes with the remaining time. |
| FR-TIME-3 | "None" disables the respective countdown. |
| FR-TIME-4 | The public state carries the running timer (`kind`, `playerId`, `remainingMs`, `durationMs`); clients count down locally. |

## 14. Presence and absent players

| Id | Requirement |
|---|---|
| FR-PRES-1 | Presence per player across all their sockets/tabs: `online`, `offline` (disconnected for less than the grace period), `away` (longer). Grace period 30 s (`PRESENCE_GRACE_MS`, default `DEFAULT_GRACE_MS`). |
| FR-PRES-2 | **Lobby:** a player disconnected longer than the grace period is removed from the room. |
| FR-PRES-3 | **Game:** an away player keeps the seat; their turns are skipped (`turn_skipped`) and when they must disprove the server shows a random matching card. If every remaining player is away, turns are not skipped. A returning player continues normally. |
| FR-PRES-4 | Presence is visible in the lobby list and the players bar. |

## 15. Privacy guarantees

| Id | Guarantee |
|---|---|
| FR-PRIV-1 | The envelope is never sent to anyone during the game, except privately to a player eliminated by a wrong accusation; it becomes public only when the game is finished (and in the lobby's last-game summary). |
| FR-PRIV-2 | A hand is sent only to its owner. Other players see only card counts. |
| FR-PRIV-3 | A shown card is sent only to the suggester (`seenCards`); everyone else learns only who showed a card to whom. |
| FR-PRIV-4 | Room card ids are sent only to players who have stood in that room; others see only which rooms hold a card. |
| FR-PRIV-5 | The disprover alone receives the list of their matching cards. |

Each guarantee is covered by API tests that record every event a third player's socket receives, and by e2e checks that the private text is absent from other players' DOM.
