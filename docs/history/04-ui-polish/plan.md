> **Archived – not current.** Kept for history only. Current state: [`docs/README.md`](../../README.md). Do not use this file as a source of requirements or tasks.

# TODO Implementation Plan (UI polish: tooltips, card hints, rules summary, log icons)

> **For agentic workers:** execute inline with superpowers:executing-plans, task by task, in the order below. Steps use checkbox (`- [x]`) syntax for tracking.
>
> **Execution mode (lean):** every task is small and web-only, so there is **no parallelism and no worktree per task**. Work on one branch `todo/04-ui-polish` off `main`, one Conventional Commit per task. Per task run only `pnpm --filter @mystery-game/web test`, `pnpm lint`, `pnpm typecheck` and the **targeted** Playwright spec(s) named in the task. The full Done (`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`) runs once, in task `D1`.

**Goal:** Implement every item of `docs/todo.md` → "Do zrobienia" (10 items).

**Architecture:** Everything lives in `apps/web`. No domain rules, contracts, socket commands, error codes or projections change. Two small shared pieces are introduced first and reused by later tasks: `shared/ui/Tooltip.tsx` (one tooltip behaviour for the whole HTML UI) and `cards/CardHint.tsx` (the "in hand" chip + notebook mark extracted from `CardSelectGrid`).

**Tech Stack:** React 19, Tailwind 4 (CSS tokens, container queries), lucide-react icons (already a dependency), Vitest + Testing Library, Playwright.

**Spec:** `docs/todo.md` (Polish).

## Global Constraints

- Web only. The web still decides nothing about rules or visibility: card hints come from `me.hand` and the existing notebook marks (`useCardAnnotations` / `useNotebookMarks`), nothing new from the server.
- No new dependencies. Icons from `lucide-react` (`Hand`, `Info`, `BookOpen`/`CircleHelp`), card icons from `features/cards` (`CardIcon`).
- i18n: every new string in the feature's `i18n.ts`, `en` + `pl`.
- Styles: existing tokens only (`bg-surface`, `border-line`, `text-muted`, `text-brand-strong`, …). If a colour is genuinely missing, add a token in both themes. No new animations.
- Accessibility: every trigger is a `<button>` with an accessible name; tooltips use `role="tooltip"` and are linked with `aria-describedby` while open. Playwright selects by role/label with EN names.
- Keep the code simple: no positioning library, no portals, no measuring with `ResizeObserver`. Edge handling is a pure clamp function (map) or an `align` prop (HTML).
- Feature imports only through `index.ts`.

## Review Focus

1. **One tooltip behaviour everywhere** – mouse: show on hover, hide on leave; touch/click: tap toggles, tap elsewhere or `Escape` closes. Same for the map tokens (already so), notebook player headers, the notebook "in hand" icon and the settings info buttons. Native `title` attributes are removed where a `Tooltip` replaces them.
2. **Map tooltip never leaves the visible view** – also when zoomed in and for tokens at the board edges (left/right/top). → unit test of the clamp function.
3. **Rename does not break selectors** – region/collapsible "Notebook" → "Cards" everywhere (web tests, `GamePage`, specs); no other region is already called "Cards".

---

## Order

| # | Task | Items | Depends on |
|---|---|---|---|
| 1 | **TT** Shared tooltip + map edge clamp | 3, 4 | – |
| 2 | **PB** Player ring not clipped | 5 | – |
| 3 | **CH** Card hints (suggestion room, notebook hand) | 1, 6 | TT |
| 4 | **RN** "Notebook" → "Cards" | 7 | CH (same files) |
| 5 | **LG** Event log icons | 8 | – |
| 6 | **RS** Rules summary in the header | 2 | – |
| 7 | **RV** Room settings view + in-game section | 10 | – |
| 8 | **SI** Room setting explanations | 9 (+10) | TT, RV |
| 9 | **D1** Docs, full Done, archive | – | all |

---

## Task TT: Shared tooltip + map tooltip edge clamp (items 3, 4)

**Files:** Create `apps/web/src/shared/ui/Tooltip.tsx`, `Tooltip.test.tsx`; Modify `features/notebook/Notebook.tsx` (player header), `features/board/geometry.ts` (+ `geometry.test.ts`), `features/board/Board.tsx` (tooltip `<text>` only).

**Interfaces – Produces:**
```ts
// shared/ui/Tooltip.tsx
export function Tooltip(props: {
  label: string;                 // accessible name of the trigger button
  content: ReactNode;            // tooltip body
  children: ReactNode;           // visible trigger content (initial, icon, …)
  align?: "start" | "center" | "end"; // horizontal anchor of the bubble, default "center"
  className?: string;            // trigger button classes
}): JSX.Element;
// pointerenter/leave with pointerType "mouse" → show/hide (not pinned)
// click → toggle pinned; Escape or pointerdown outside (document listener only while open) → close
// bubble: absolute, top-full, z-10, max-w-60, whitespace-normal, rounded border-line bg-surface text-xs shadow-sm

// board/geometry.ts
export function tooltipAnchor(point: Point, text: string, view: ViewBox): { x: number; y: number };
// estimated width = text.length * 7 (font 12, bold); x clamped to
// [view.x + w/2 + 4, view.x + view.width - w/2 - 4]; y above the token (point.y - PAWN_R - 8),
// or below it (point.y + PAWN_R + 16) when that would be above view.y + 14.
```
Notebook player header: replace the hand-made `headerTip` state + `title` with `<Tooltip label={p.name} content={p.name} align="end">initial</Tooltip>` (last columns sit at the right edge, so `end`). Board: keep the SVG `<text>` (`textAnchor="middle"`), only take `x`/`y` from `tooltipAnchor(tip.point, tip.text, view)`.

- [x] **Step 1: Failing tests:** `Tooltip.test.tsx` – `hover shows and leave hides`, `click pins, second click closes`, `Escape closes`, `click outside closes`, `trigger has aria-describedby while open`. `geometry.test.ts` – `tooltipAnchor keeps a long text inside the left edge`, `…right edge`, `goes below the token at the top edge`, `unchanged in the middle`, `respects a zoomed view`.
- [x] **Step 2–4:** FAIL → implement → PASS (`Notebook.test.tsx` / `Board.test.tsx` updated if they relied on `title` or the old state).
- [x] **Step 5: E2E** (`apps/e2e/tests/notebook.spec.ts`, desktop project): `hovering a player header shows the player's name in a tooltip`.
- [x] **Step 6:** Commit `feat(web): shared tooltip, map tooltip stays inside the view`.

## Task PB: Player ring not clipped (item 5)

**Files:** Modify `features/players/PlayersBar.tsx` only (scope confirmed: the players bar on the game screen – player chips and the active player's ring).

Cause: the `<ul>` has `overflow-x-auto` (which forces `overflow-y` to clip too) and only `py-1`, while the active chip draws `ring-2` outside its border. Fix: give the scrolling list enough padding for the ring (`p-1`, compensate with `-mx-1` on the list if the alignment shifts) – no change of the ring itself.

- [x] **Step 1:** Reproduce in the dev app (active player first / last in the bar, mobile + desktop).
- [x] **Step 2:** Fix; check both themes and both viewports. Existing `PlayersBar.test.tsx` and `game-start.spec.ts` stay green (no new test – pure styling).
- [x] **Step 3:** Commit `fix(web): active player ring no longer clipped in the players bar`.

## Task CH: Card hints – suggestion room and notebook hand (items 1, 6)

**Files:** Create `features/cards/CardHint.tsx`; Modify `features/cards/{CardSelectGrid.tsx,index.ts}`, `features/suggestion/SuggestionDialog.tsx` (+ test), `features/notebook/{Notebook.tsx,i18n.ts,Notebook.test.tsx}`.

**Interfaces – Produces:**
```ts
// cards/CardHint.tsx – extracted unchanged from CardSelectGrid
export function InHandChip(): JSX.Element;                      // Hand icon + "In hand"
export function CardHint({ note }: { note: CardAnnotation }): JSX.Element | null; // InHandChip and/or mark, null when nothing to show
```
- `CardSelectGrid` renders `<CardHint note={annotate(id)} />` (no visual change).
- `SuggestionDialog`: under the fixed room `CardTile` render `<CardHint note={annotate(room)} />` – same hint as for suspects and weapons.
- Notebook row header of a card in my hand: replace the `sr-only` "(In hand)" with a `Tooltip` (label/content "In your hand" / "Na Twojej ręce") whose trigger is the `Hand` icon + a text "In hand" hidden when narrow – Tailwind 4 container query: name `<span>` gets `@container`, text `hidden @[9rem]:inline`. Keep `data-in-hand` on the row (used by `GamePage.hand()`).

- [x] **Step 1: Failing tests:** `SuggestionDialog shows "In hand" for the room when I hold it`; `…shows the notebook mark of the room`; `Notebook: hand row has an "In your hand" button with a tooltip`.
- [x] **Step 2–4:** FAIL → implement → PASS.
- [x] **Step 5: E2E** (`suggestion.spec.ts`): scenario gives the suggester the room card → dialog shows "In hand" under the room.
- [x] **Step 6:** Commit `feat(web): room hint in the suggestion dialog, hand marker in the notebook`.

## Task RN: Rename "Notebook" → "Cards" (item 7)

**Files:** Modify `features/notebook/i18n.ts` (`notebook` → EN "Cards", PL "Karty"), `features/game/i18n.ts` (collapsible title), `features/game/GameScreen.test.tsx`, `features/notebook/Notebook.test.tsx`, `apps/e2e/pages/GamePage.ts`, `apps/e2e/tests/{layout,dialogs,presence,notebook}.spec.ts` (every `"Notebook"` name).

Only user-visible names change. Folder/identifier names (`features/notebook`, `notebookKey`, storage keys `notebook:*`, `ui:collapsed:notebook`) stay, so stored marks and the collapsed state survive.

- [x] **Step 1:** Update tests to `"Cards"` → FAIL. **Step 2:** Change texts → PASS. `grep -rn '"Notebook"' apps/` returns nothing user-facing.
- [x] **Step 3:** Commit `feat(web): rename the notebook section to Cards`.

## Task LG: Event log icons (item 8)

**Files:** Modify `features/event-log/EventLog.tsx` (+ `EventLog.test.tsx`); `describe.ts` unchanged.

For `suggested` and `accused` events, the entry starts with an `aria-hidden` group of three `CardIcon`s (suspect, weapon, room, size 16) followed by the unchanged sentence. Text and i18n keys stay, so screen readers and the existing e2e text assertions are unaffected. Small helper in `EventLog.tsx`: `triple(event): CardId[] | null`.

- [x] **Step 1: Failing test:** `suggested entry shows icons of the three cards` (3 `svg`/icons inside the `li`, text unchanged).
- [x] **Step 2–4:** FAIL → implement → PASS. Check mobile width: icons `shrink-0`, text wraps.
- [x] **Step 5:** Commit `feat(web): card icons in suggestion and accusation log entries`.

## Task RS: Rules summary in the header (item 2)

**Files:** Create `features/rules-help/{RulesButton.tsx,rulesItems.ts,rulesItems.test.ts,i18n.ts,index.ts,RulesButton.test.tsx}`; Modify `app/AppHeader.tsx` (place the button next to the theme/locale switchers, on every screen); new `apps/e2e/tests/rules-help.spec.ts`.

`RulesButton`: icon button (`CircleHelp`), accessible name "Rules" / "Zasady", opens the existing `ModalDialog` titled "How to play" / "Jak grać". Content = short list (EN+PL) of one-line bullets, built by a pure function from the current room settings.

**Interfaces – Produces:**
```ts
// rules-help/rulesItems.ts
export type RulesItem = { key: RulesKey; params?: Record<string, string | number>; optional: boolean };
export function rulesItems(settings: RoomSettings | null): RulesItem[];
```
- **Base rules** (`optional: false`, always): goal (who, with what, where – the cards in the envelope); turn: roll and move or use a secret passage; enter a room → suggest (the named pawn is moved there); players in turn order disprove by showing one card, only to you; wrong accusation = out, but you still show cards; first correct accusation wins.
- **Room-setting rules** (`optional: true`), one line per setting, text depends on the value: accusation place (any room / only the room you are in); accuse after a suggestion in the same turn (allowed / not allowed); suggest after staying in a room (only when on); turn time limit (`{n} s per turn` / no limit); time to show a card (`{n} s, then a random card is shown` / no limit); face-down room cards (only when > 0: `{n} cards lie face down in rooms; stand in the room to look`); automatic notes in "Cards" (on / off).
- Settings come from `useContext(GameContext)?.room.settings` (the header is inside `GameProvider` in a room); outside a room (`null`) the room-setting lines are replaced by one line "The host can change some rules in the room settings." (`optional: true`).
- Optional lines are visually marked: a small chip "Room setting" / "Ustawienie pokoju" (existing tokens, e.g. `bg-surface-2 text-brand-strong`), grouped under a sub-heading "In this room" / "W tym pokoju". The chip text is part of the line's accessible text.

- [x] **Step 1: Failing tests:** `rulesItems.test.ts` – `null settings → base rules + one host note`; `defaults → one optional line per setting except disabled ones (suggest after staying off, 0 room cards)`; `values are reflected (turn limit 30 → n=30, named_room, accuse-after-suggestion off)`; every base item `optional: false`, every setting item `optional: true`. `RulesButton.test.tsx` – `opens and closes the dialog`; `optional lines carry the "Room setting" chip`; `PL text when locale is pl`.
- [x] **Step 2–4:** FAIL → implement → PASS.
- [x] **Step 5: E2E:** `rules button opens "How to play" on the home screen`; `in the lobby, after the host sets the turn limit to 30 s, a guest sees "30 s" marked as a room setting`.
- [x] **Step 6:** Commit `feat(web): short rules summary in the header`.

## Task RV: Room settings view, read-only section in the game (item 10)

**Files:** Create `features/room-settings/{RoomSettingsView.tsx,RoomSettingsView.test.tsx,i18n.ts,index.ts}`; Modify `features/lobby/{RoomSettingsPanel.tsx,i18n.ts,RoomSettingsPanel.test.tsx}`, `features/game/{GameScreen.tsx,i18n.ts,GameScreen.test.tsx}`, `apps/e2e/pages/GamePage.ts` (append), `apps/e2e/tests/settings.spec.ts`.

Why a new feature folder: `lobby` already imports `game` (`useGame`), so the game screen importing the lobby panel would create a cycle. The presentational part moves out, both screens use it.

**Interfaces – Produces:**
```ts
// room-settings/RoomSettingsView.tsx – the rows moved unchanged from RoomSettingsPanel (SelectRow, CheckRow, labels, option lists)
export function RoomSettingsView(props: {
  settings: RoomSettings;
  onChange?: (patch: UpdateSettingsRequest) => void; // missing = read-only (all controls disabled)
}): JSX.Element;
```
- `lobby/RoomSettingsPanel` keeps the heading, `send("room:settings")` and the error message; renders `<RoomSettingsView settings={room.settings} onChange={isHost ? change : undefined} />`. Setting texts move from `lobby/i18n.ts` to `room-settings/i18n.ts` (keys unchanged).
- `GameScreen`: last item of the right column, after "Cards": `<Collapsible id="settings" title={t("settings")} defaultOpen={false}><RoomSettingsView settings={game.settings} /></Collapsible>` – EN "Room settings", PL "Ustawienia pokoju". Collapsed state persisted like the other sections (`ui:collapsed:settings`).

- [x] **Step 1: Failing tests:** `RoomSettingsView` – `without onChange all controls are disabled`; `with onChange a change sends a one-field patch` (moved from the lobby test). `GameScreen` – `"Room settings" is the last section and collapsed by default`; `expanded it shows the game's settings read-only`. Existing `RoomSettingsPanel.test.tsx` stays green.
- [x] **Step 2–4:** FAIL → implement → PASS.
- [x] **Step 5: E2E** (`settings.spec.ts`): `host sets turn limit 30 s, after start a guest expands "Room settings" and sees 30 s (disabled)`.
- [x] **Step 6:** Commit `feat(web): read-only room settings section in the game`.

## Task SI: Room setting explanations (item 9)

**Files:** Modify `features/room-settings/{RoomSettingsView.tsx,i18n.ts,RoomSettingsView.test.tsx}`, `apps/e2e/tests/settings.spec.ts`. (Lives in the shared view, so the explanations show both in the lobby and in the in-game section.)

`SelectRow` / `CheckRow` get a required `info: string` prop rendered as `<Tooltip label={t("about", { setting: label })} content={info} align="end"><Info …/></Tooltip>` next to the label (EN "About: {setting}", PL "Więcej: {setting}"). Visible to host and guests (also when the controls are disabled). One or two sentences per setting, EN+PL, describing the effect in play (e.g. room cards: "Cards placed face down in random rooms instead of being dealt. Anyone who has stood in the room may look at its card; they are never used to disprove.").

- [x] **Step 1: Failing tests:** `every setting has an info button`; `clicking info shows the explanation`; `guest can open info although controls are disabled`.
- [x] **Step 2–4:** FAIL → implement → PASS.
- [x] **Step 5: E2E** (`settings.spec.ts`): `guest opens the explanation of "Face-down cards in rooms"`.
- [x] **Step 6:** Commit `feat(lobby): explanations for room settings`.

## Task D1: Docs, full Done, archive

**Files:** `docs/product/features.md` (tooltips, card hints, Cards section name, log icons, rules summary, setting explanations, in-game "Room settings" section – new `FR-*` ids where they are new behaviour), `docs/product/overview.md` / `decisions.md` / `docs/technical/adr.md` (rename "Notebook" → "Cards" where it names the UI section), `docs/technical/architecture.md` (only if it lists shared UI: add `Tooltip`, `CardHint`, feature `room-settings`), `docs/todo.md`, `docs/history/`.

- [x] **Step 1:** Update the docs above (state, not history).
- [x] **Step 2:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e` → all green (report failures with output).
- [x] **Step 3:** Archive: move the done items of `docs/todo.md` and this plan to `docs/history/04-ui-polish/{todo.md,plan.md}` with the archive banner, add a row to `docs/history/README.md`, leave only open items in `docs/todo.md`.
- [x] **Step 4:** Commit `docs: describe UI polish batch and archive it`.

---

## Coverage check (spec → task)

| todo.md | Task |
|---|---|
| Podejrzenie – info o pomieszczeniu | CH |
| Ściąga z zasad | RS |
| Spójne tooltipy | TT (+ CH, SI reuse) |
| Tooltipy na mapie ucinane | TT |
| Ucięta ramka gracza | PB |
| Notatnik – karty na ręce | CH |
| Zmiana nazwy sekcji | RN (+ D1 docs) |
| Dziennik – ikonki | LG |
| Konfiguracja pokoju – wyjaśnienia | SI |
| Podgląd ustawień pokoju w trakcie gry | RV (+ SI) |
