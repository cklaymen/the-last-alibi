# Product overview

## What it is

**The Last Alibi** is an online, real-time deduction board game for **2–6 players** ("who, with what, where"). It follows the mechanics of the classic Hasbro rulebook (2020 edition, traditional game without clue cards – see [`game-rules.md`](game-rules.md)) but has its **own identity**: its own title, neutral colour-named characters, its own artwork and board drawing. It must not be presented as Cluedo or reuse protected names/artwork.

Players meet in a **private room** identified by a numeric code or link, pick characters, and play on a shared board. One player (the **host**) configures house rules in the lobby. After a game everyone returns to the same room's lobby and can play again.

## Product goals (requirements)

- **Faithful rules by default**, with deliberate, documented deviations and host-selectable house rules ([`decisions.md`](decisions.md)).
- **Fair and private:** the server decides everything; no client can see another player's cards, the envelope or cards shown to someone else.
- **Mobile first**, comfortable on a 360 px wide phone, responsive on desktop.
- **No accounts:** a nickname is enough; a page refresh or a short disconnection does not lose your seat.
- **Light / dark / system theme** and **Polish / English** interface.
- **Accessible:** every control has a role and accessible name; animations respect `prefers-reduced-motion`.
- **Helpful but optional assistance:** a detective notebook that can deduce facts automatically (host can turn this off).
- **Paced play:** configurable turn and card-showing time limits; absent players do not block the game.

## Out of scope (current product)

Accounts and login, public room search / matchmaking, spectators, chat, bots/AI players, ranking/statistics, offline play, clue cards, joining a game already in progress, transferring the host role manually, persistence across server restarts (all state is in memory).

## Glossary

| Term | Meaning |
|---|---|
| **Room** | A private table with a 4–6 digit code (generated codes have 6 digits); holds the lobby and at most one running game. |
| **Host** | The room creator (or the next player if the host leaves the lobby). Configures settings, starts the game, can remove players in the lobby. |
| **Lobby** | Room phase before a game: join, choose characters, set house rules. |
| **Character / pawn** | One of six colour-named suspects (`red`, `yellow`, `white`, `green`, `blue`, `purple`). All six pawns are on the board even if unplayed. |
| **Card** | 21 cards: 6 suspects, 6 weapons, 9 rooms. |
| **Envelope** | The hidden solution: one suspect + one weapon + one room. |
| **Hand** | Cards dealt to a player. |
| **Room card** | A face-down card lying in a room (optional variant); belongs to nobody. |
| **Suggestion** | "I suspect X with Y in this room" – asks the other players to disprove. |
| **Disprove** | Showing one matching card privately to the suggester. |
| **Accusation** | Final guess of the envelope; wrong = eliminated. |
| **Eliminated** | Player who accused wrongly: no more turns, but still disproves. |
| **Summoned** | A player whose pawn was moved into a room by someone else's suggestion. |
| **Presence** | `online` / `offline` (disconnected < grace period) / `away` (longer). |
| **Action section** | The sticky panel on the game screen showing what is happening and what I can do now. |
| **Notebook** (UI section "Cards") | The merged "my cards + notes" table with manual and automatic marks. |
| **Projection** | The server-built view of the game for everybody (public) or for one player (private). |
