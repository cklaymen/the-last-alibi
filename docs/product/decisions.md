# Product and rule decisions

Decisions about *what* the game does – especially where it deliberately differs from the official rulebook – and why. Architecture decisions are in [`../technical/adr.md`](../technical/adr.md). Status is **Accepted** unless stated otherwise. Ids are stable; append new ones.

Format: **Decision** · *Why* · *Consequences / where*.

---

## Rules and deviations from the rulebook

**PD-1 – Traditional game without clue cards.**
The 29 clue cards of the 2020 edition are not used.
*Why:* the rulebook allows it; the clue mechanic adds a lot of UI for little deduction value.
*Where:* `game-rules.md` intro.

**PD-2 – Movement "up to" the dice total.**
A player may stop on any reachable square within the total, instead of moving exactly the number rolled.
*Why:* on a touch screen choosing a destination is the natural interaction; exact counting adds friction and invites "wasted" turns.
*Where:* `packages/game/src/movement/reachable.ts`.

**PD-3 – Suggestion only after entering (or being summoned) – staying is a house rule.**
By default a suggestion requires entering the room this turn or having been moved there by someone else's suggestion. The rulebook behaviour (suggest after staying) is the host option `suggestAfterStaying` (default off).
*Why:* the original app behaviour; prevents repeating the same suggestion turn after turn from one room. The option keeps the official rule available.

**PD-4 – A suggestion replaces movement.**
After suggesting, a player cannot roll, move or use a passage in that turn. A summoned player chooses: move **or** suggest in the room they were moved to.
*Why:* matches the rulebook ("on your next turn you may move your dice roll, or make a suggestion in that room") and closes a loophole (suggest, then walk away in the same turn). Error code `ALREADY_SUGGESTED`.

**PD-5 – Accusation only from a room.**
An accusation requires the pawn to stand in a room (any room by default). Host option `accusationPlace = named_room` additionally requires naming that room.
*Why:* the rulebook's reference section says you must be in a room to accuse; `named_room` is a popular stricter house rule. Error codes `NOT_IN_ROOM`, `WRONG_ROOM`.

**PD-6 – Accusing right after a suggestion is allowed, but can be disabled.**
Option `accuseAfterSuggestion` (default on, as in the rulebook). Off → wait until the next turn.
*Why:* some groups find "suggest, see nothing, accuse" too strong. Error code `ACCUSE_AFTER_SUGGESTION_DISABLED`.

**PD-7 – Last non-eliminated player wins automatically.**
The official "nobody wins" ending cannot happen.
*Why:* in an online game a lone remaining player has no meaningful game left; ending is cleaner.
*Where:* `winReason: "LAST_STANDING"`.

**PD-8 – Eliminated players keep disproving.**
They have no turns but must show cards; their pawn stays and can be summoned.
*Why:* rulebook; otherwise their cards would leave the information pool.

**PD-9 – Disproving is mandatory and automatic for players without a match.**
No "pass" button exists; the server passes for players with no matching card.
*Why:* rulebook says a player with a match must show; automation removes waiting for trivial passes.

**PD-10 – Face-down room cards instead of the 2-player variant.**
The official 2-player variant (4 cards face down in rooms) is generalised into the option `roomCards` 0–8 for any player count, default 0 (2 players get a normal 9/9 deal). A card can be peeked by anyone whose pawn has stood in that room this game, however they got there; it never disproves.
*Why:* one mechanic covers the official variant and lets groups balance hand sizes.

**PD-11 – Classic board with a Hall.**
The board follows the classic layout with the Hall (the 2020 edition has a Bathroom there), drawn originally.
*Why:* familiar layout; the drawing and geometry are our own.

**PD-12 – Own identity.**
Title "The Last Alibi", colour-named characters (`red` … `purple` → "Ms. Red", "Col. Yellow", …), own icons and artwork; no original names or images. Display names live only in `web/features/cards/i18n.ts`, artwork mapping in `cardArt.ts`.
*Why:* legal – the product must not present itself as Cluedo.

## Online play

**PD-13 – Host-configurable house rules in the lobby only.**
All options are set by the host before the game, visible to everyone, kept when the room returns to the lobby.
*Why:* rules must not change under players' feet; keeping them avoids re-configuring every game.

**PD-14 – Time limits by default (turn 90 s, show a card 30 s).**
On expiry the server ends the turn / shows a random matching card. The turn timer pauses during a disproof.
*Why:* one slow or distracted player must not stall a 6-player game; pausing keeps the disprover's delay from eating the active player's time.

**PD-15 – Absent players are handled automatically.**
After a 30 s grace period a disconnected player leaves the lobby, or in a game becomes "away" (turns skipped, cards shown randomly). They can return at any time.
*Why:* a dropped connection must neither stop the game nor cost the seat.
*Note:* an older plan specified 60 s; 30 s is the implemented value (`DEFAULT_GRACE_MS`).

**PD-16 – No game-over screen; the room returns to the lobby immediately.**
The lobby shows the last-game summary (winner, reason, solution); the host can start a new game with the same players.
*Why:* fewer screens; "play again" becomes simply "start game". Superseded the earlier `room:restart` / `GameOverScreen` design.

**PD-17 – No joining mid-game, no spectators.**
*Why:* hands are dealt at start; a late joiner has nothing to do. Out of scope for now.

## Game screen UX

**PD-18 – One sticky action section.**
Everything that requires attention (turn buttons, disprove choice, suggestion result, timer, room card) is in one panel that stays visible (desktop: sticky top; mobile: sticky top *and* bottom, CSS only).
*Why:* players on phones missed prompts below the board.

**PD-19 – Attention highlight and urgency.**
Orange-yellow animated frame when I must act; red pulse in the last 10 s.
*Why:* the most common failure was not noticing it is your turn or that you must show a card.

**PD-20 – Suggestion result in the action section, not only in the log.**
Visible to all until the end of the turn; the card itself only to the suggester. The former "Seen cards" list was removed (history lives in the notebook and log).

**PD-21 – Merged notebook table with per-player columns.**
"My cards", notebook and "seen cards" became one table with a column per other player.
*Why:* real players track *who* has what; three separate panels duplicated information.

**PD-22 – Automatic notes are facts-only and overridable.**
Deductions use only provable facts (never manual marks); manual marks always win in display; automatic marks look lighter; only manual marks are stored. Host can turn automation off (`autoNotes`), leaving only facts the player knows directly.
*Why:* helpful for casual players without taking agency from experienced ones; never trust user input as fact (it may be wrong); recomputation keeps the notebook consistent across devices.

**PD-23 – Full event history sent to clients.**
The previous 50-event window was removed.
*Why:* deductions and the log must be identical after a refresh or on another device. The history is small (hundreds of events at most).

**PD-24 – No notebook migration.**
Notebook storage key is versioned (`notebook:v2:`); older entries are ignored.
*Why:* a new version means a server restart, which wipes all games anyway.

**PD-25 – Visible build version on the home screen.**
UTC build timestamp (minutes) plus optional short commit hash; `dev` locally. Computed at build time without git inside the Docker build (`.git` is ignored) – the hash is passed as `GIT_SHA`.
*Why:* lets testers report which build they played.
