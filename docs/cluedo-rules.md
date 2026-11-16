Cluedo – Standard Board Game Rules

Source: official Hasbro rulebook *Cluedo – The Classic Mystery Game* (2020 edition, 38712 en-GB),
played as the **traditional game**, i.e. without the 29 clue cards (the rulebook explicitly allows this:
"To play the traditional game of CLUEDO, simply remove the 29 clue cards from the game").

Objective
The goal of Cluedo is to solve the mystery by determining:
Who committed the murder?
What weapon was used?
In which room did it happen?
At the beginning of the game, one Suspect card, one Weapon card, and one Room card are secretly placed inside the case file envelope. These three cards represent the correct answer. The remaining cards are shuffled together and dealt out among the players.

Components (traditional game)
- 6 character tokens, 6 miniature weapons, 2 dice, detective notebook sheets, 1 case file envelope.
- 21 cards: 6 character cards, 6 weapon cards, 9 room cards.

Game Setup
1. Place all 6 character tokens on their named starting spaces – all tokens are on the board, even if fewer than 6 people play.
2. Place the 6 weapons in separate, random rooms (one weapon per room).
3. Separate the Suspect, Weapon, and Room cards into three decks, shuffle each and place them face down.
4. Take the top card from each deck and slip it into the case file envelope without looking.
5. Shuffle the remaining cards together and deal them all out among the players. It does not matter if some players have more cards than others.
6. Each player receives a detective notebook sheet, secretly looks at their cards and marks them off – they cannot be in the envelope. Cards and sheets are kept secret.

Turn order
Miss Scarlett always starts and play continues clockwise. If no one plays Miss Scarlett, the next character clockwise starts (Mustard, Orchid, etc.).

Gameplay
On your turn:

1. Movement – choose one of:
   - Roll the two dice and move your token the number of squares shown.
     - You cannot move diagonally.
     - You cannot move through the same square twice on one turn.
     - You cannot land on or move through a square occupied by another token.
     - Rooms are entered only through doorways. You may not pass through a doorway blocked by another token, whether you are inside or outside the room.
     - It does not matter if you roll more than you need to enter a room – stop moving once you are inside.
     - Any number of tokens may be in a room at the same time.
   - Use a secret passage: if you are in a corner room with a passage at the start of your turn, you may move to the connected corner room instead of rolling. Passages: Kitchen ↔ Study, Conservatory ↔ Lounge.
   - Stay in the room your token is already in.
2. Making a Suggestion
   If your token is in a room, you may make a suggestion by naming:
   one suspect,
   one weapon,
   the room you are currently in.
   For example:
   "I suggest it was Reverend Green, with the Rope, in the Lounge."
   The named suspect token and weapon are moved into that room. Characters and weapons called to rooms are not returned to their original place, and there is no limit to how many may be in a room.
   If your character is moved into a room by someone else's suggestion, you stay there; on your next turn you may move your dice roll, or make a suggestion in that room.
3. Refuting a Suggestion
   Starting with the player to your left and continuing clockwise, each player checks their hand.
   If a player has at least one of the three named cards, they must secretly show one of those cards (their choice) to the suggesting player – and only to them. This ends the refutation.
   If they have none of the named cards, they say so and the next player checks.
   If no one can show a card, that is fine – it is valuable information.
4. Taking Notes
   Players use their detective sheets to record:
   cards they have seen (and who showed them),
   suggestions that could not be disproved,
   deductions about the hidden solution.
5. End of turn – the player to your left goes next.

Making an Accusation
Once you think you know who did it, with what and where, you may make your accusation – on your turn only, and only once per game. You may accuse straight after making a suggestion, without rolling again. You do not have to be in the room you name (the reference section of the rulebook adds that you must be in a room – any room – to accuse).
Say "I accuse [character], with [a weapon], in [a room]" and secretly look inside the envelope.
- If all 3 cards are correct, you win: show the cards to everyone; the game is over.
- If any card is wrong, secretly put all 3 cards back in the envelope. You take no further turns and make no more suggestions, so you cannot win. You must still show cards in response to other players' suggestions, and other players may still move your character token into rooms with their suggestions.
- The other players continue until someone makes a correct accusation. If no one does, the murderer got away with it and no one wins.

Important Rules
- You may make a suggestion only while inside a room, and only for the room you are in.
- Any suspect and any weapon may be named, regardless of their current locations.
- The hidden solution always contains exactly one suspect, one weapon, and one room.
- The first player to make a correct accusation wins the game.

Official variants (not implemented)
- Clue cards (default in the 2020 edition): rolling a magnifying-glass icon (counts as 1) means drawing a clue card before moving (two icons – two cards).
- 2-player / team game: after the envelope is filled, the top 4 of the remaining shuffled cards are placed face down in 4 random rooms (or in the 4 corner rooms for a quicker game); a player entering such a room secretly looks at that card before suggesting. The rest is dealt as usual.

## Implementation clarifications (binding for this project)

The rules above leave several points open or are deliberately changed for the online game. The game implements them as follows. Character names below refer to the original game for clarity only; the app uses its own character names (see slice F5 in `game-screens-plan.md`). The board follows the classic layout with the **Hall** (the 2020 edition replaces it with a Bathroom).

Players and setup
- 2–6 players. All six character tokens start on the board, including those nobody plays (they can still be moved by suggestions).
- Six weapons start in six different random rooms.
- The red character (Miss Scarlett equivalent) moves first if played; play then continues clockwise by seat order around the board (`SEAT_ORDER`), skipping unplayed characters.
- The 18 remaining cards are dealt round-robin; with 4 or 5 players some players hold one card more (2 players: 9/9).
- **Room cards (host option "Face-down cards in rooms", 0–8, default 0):** before dealing, that many of the shuffled remaining cards are placed face down in as many different random rooms (at most one per room); the rest is dealt as usual. A player whose pawn has stood in such a room this game – by moving, by secret passage or by being moved there by a suggestion – may secretly look at that card (it stays in the room). Room cards belong to nobody and are never used for disproving. Everybody sees which rooms hold a card, never which card.

Movement
- Roll two dice and move horizontally/vertically up to the total. No diagonal moves, no passing through occupied corridor squares; a room may hold any number of tokens.
- Rooms are entered and exited only through doorways, from the corridor square in front of the door (a door whose outside square is occupied is blocked). Entering a room ends movement.
- A player may not re-enter, in the same turn, the room they left.
- A player starting the turn in a corner room with a secret passage may use the passage **instead of** rolling.
- A player may end the turn at any time during their own turn (except while a suggestion is waiting to be disproved), including without using the full roll.

Suggestions
- Allowed only in the room the player entered this turn (by moving or by secret passage), or in the room they were moved to by another player's suggestion since their last turn (they may suggest there without moving). By default, staying in a room without either does not allow a suggestion. One suggestion per turn.
- **A suggestion replaces movement:** after suggesting, a player can no longer roll, move or use a secret passage that turn (this matters for a player moved by someone else's suggestion: they either move, or suggest in that room – not both).
- **Host option "Suggest after staying in a room" (default off):** a player who starts the turn in a room may suggest there without moving, as long as they have not rolled or moved yet (as in the official rulebook).
- The named suspect token (any of the six) and weapon are moved to that room.

Disproving
- Players are asked clockwise from the suggester, **including eliminated players**; asking stops at the first player who shows a card.
- A player holding at least one named card **must** show exactly one of them (their choice). Players without a matching card pass automatically.
- Only the suggester sees the shown card; everyone sees who showed a card or that nobody could.

Accusations and end of game
- A player may accuse on their own turn, except while a suggestion is waiting to be disproved, and **only while their pawn stands in a room** (not on a corridor square).
- **Host option "Accusation location":** `any room` (default) – the accuser may stand in any room and name any room; `the named room` – the accuser must name the room they stand in.
- **Host option "Accuse after suggestion in the same turn" (default on, as in the rulebook):** when off, a player who suggested this turn cannot accuse until their next turn.
- The accuser privately sees the envelope. A correct accusation wins. A wrong one eliminates the player: their turn ends, they take no more turns, their token stays on the board (it can still be moved by suggestions) and they keep disproving.
- **House rule:** when only one non-eliminated player remains, that player wins automatically (so the official "no one wins" ending cannot occur).

Deviations from the official rules (intentional)
- Movement is "up to" the dice total instead of exactly the number rolled.
- By default a suggestion requires entering the room this turn (or being moved there); simply staying in a room does not allow a new suggestion. The official behaviour is available as the host option "Suggest after staying in a room".
- Last non-eliminated player wins automatically (see house rule).
- 2-player games use normal dealing (9/9) by default; the official 4-cards-in-rooms variant is available through the "Face-down cards in rooms" option (set it to 4). Clue cards are not used.

Online-specific rules
- All house-rule options are set by the host in the lobby only, are visible to every player and are kept when the room returns to the lobby after a game.
- **Turn time limit:** none / 30 / 60 / 90 / 120 / 180 s, default 90 s. When it runs out, the server ends the turn. The turn timer is paused (not reset) while a suggestion is waiting to be disproved and resumes with the remaining time.
- **Time to show a card:** none / 15 / 30 / 45 / 60 s, default 30 s. When it runs out, the server shows one of the disprover's matching cards at random.
- Both timers are shown to every player; the last 10 s are highlighted for the player who has to act.
- **Automatic notes** (default on): the notebook fills in conclusions that follow from the game history; manual marks always take precedence. When off, only facts (cards shown to the player) are filled in.
- A disconnected player keeps their seat. After a **30 s** grace period (`DEFAULT_GRACE_MS`, configurable with `PRESENCE_GRACE_MS`) they leave the lobby, or – in a game – become "away": their turns are skipped and a matching card is shown automatically when they must disprove.
- After the game the host can restart the room: everybody returns to the lobby with the same players and characters.

## Character mapping (in-game identity)

The app uses neutral, colour-based ids; display names live only in `apps/web/src/features/cards/i18n.ts` and artwork in `cardArt.ts`.

| id | Classic equivalent | EN name | PL name |
|---|---|---|---|
| `red` | Miss Scarlett | Ms. Red | Pani Czerwona |
| `yellow` | Colonel Mustard | Col. Yellow | Pułkownik Żółty |
| `white` | Mrs. White / Dr. Orchid | Mrs. White | Pani Biała |
| `green` | Reverend Green | Mr. Green | Pan Zielony |
| `blue` | Mrs. Peacock | Mrs. Blue | Pani Niebieska |
| `purple` | Professor Plum | Prof. Purple | Profesor Fioletowy |

Weapons: `candlestick`, `dagger`, `lead_pipe`, `revolver`, `rope`, `wrench`. Rooms: `kitchen`, `ballroom`, `conservatory`, `dining_room`, `billiard_room`, `library`, `lounge`, `hall`, `study`. Secret passages: kitchen ↔ study, conservatory ↔ lounge. Seat/turn order: red, yellow, white, green, blue, purple (`SEAT_ORDER`).
