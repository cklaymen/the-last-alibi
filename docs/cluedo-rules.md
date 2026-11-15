Cluedo – Standard Board Game Rules
Objective
The goal of Cluedo is to solve the mystery by determining:
Who committed the murder?
What weapon was used?
In which room did it happen?
At the beginning of the game, one Suspect card, one Weapon card, and one Room card are secretly placed inside the solution envelope. These three cards represent the correct answer. The remaining cards are shuffled together and dealt evenly among the players.
Game Setup
Each player chooses a character and places the corresponding token on its starting space.
Separate the Suspect, Weapon, and Room cards into three decks.
Randomly place one card from each deck into the confidential envelope without looking.
Shuffle the remaining cards together and deal them as evenly as possible among all players.
Each player receives a detective notepad to keep track of clues.
Gameplay

1. Movement
   On each turn:
   Roll the two dice.
   Move your character up to the total number of spaces rolled.
   Enter a room if possible.
2. Making a Suggestion
   When your character is inside a room, you may make a suggestion by naming:
   one suspect,
   one weapon,
   the room you are currently in.
   For example:
   "I suggest it was Miss Scarlett with the Dagger in the Library."
   The named suspect and weapon are immediately moved into that room (if they are elsewhere on the board).
3. Refuting a Suggestion
   Starting with the player to your left and continuing clockwise, each player attempts to disprove the suggestion.
   If a player has at least one of the three named cards, they must secretly show one of those cards to the suggesting player.
   If they have none of the named cards, play continues to the next player.
   Only the suggesting player sees the revealed card.
4. Taking Notes
   Players use their detective sheets to record:
   cards they have seen,
   suggestions that could not be disproved,
   deductions about the hidden solution.
   Making an Accusation
   During your turn (according to your edition's rules), you may make a final accusation by naming:
   the suspect,
   the weapon,
   the room.
   You then secretly check the solution envelope.
   If your accusation is correct, you win the game.
   If it is incorrect, you are eliminated from winning but usually continue showing cards to other players when required.
   Important Rules
   You may make a suggestion only while inside a room.
   Any suspect and any weapon may be named, regardless of their current locations.
   The hidden solution always contains exactly one suspect, one weapon, and one room.
   The first player to make a correct accusation wins the game.

## Implementation clarifications (binding for this project)

The rules above leave several points open ("according to your edition's rules"). The game implements them as follows. Character names below refer to the original game for clarity only; the app uses its own character names (see slice F5 in `game-screens-plan.md`).

Players and setup
- 2–6 players. All six character tokens start on the board, including those nobody plays (they can still be moved by suggestions).
- Six weapons start in six different random rooms.
- The red character (Miss Scarlett equivalent) moves first if played; play then continues clockwise by seat order around the board (`SEAT_ORDER`), skipping unplayed characters.
- The 18 remaining cards are dealt round-robin; with 4 or 5 players some players hold one card more (2 players: 9/9).

Movement
- Roll two dice and move horizontally/vertically up to the total. No diagonal moves, no passing through occupied corridor squares; a room may hold any number of tokens.
- Rooms are entered and exited only through doorways, from the corridor square in front of the door. Entering a room ends movement.
- A player may not re-enter, in the same turn, the room they left.
- A player starting the turn in a corner room with a secret passage may use the passage **instead of** rolling.
- A player may end the turn at any time during their own turn (except while a suggestion is waiting to be disproved), including without using the full roll.

Suggestions
- Allowed only in the room the player entered this turn (by moving or by secret passage), or in the room they were moved to by another player's suggestion since their last turn (they may suggest there without moving). Staying in a room without either does not allow a suggestion. One suggestion per turn.
- The named suspect token (any of the six) and weapon are moved to that room.

Disproving
- Players are asked clockwise from the suggester, **including eliminated players**.
- A player holding at least one named card **must** show exactly one of them (their choice). Players without a matching card pass automatically.
- Only the suggester sees the shown card; everyone sees who showed a card or that nobody could.

Accusations and end of game
- A player may accuse at any point of their own turn (before rolling, after moving, after a suggestion), except while a suggestion is waiting to be disproved. Any room may be named.
- The accuser privately sees the envelope. A correct accusation wins. A wrong one eliminates the player: their turn ends, they take no more turns, their token stays on the board and they keep disproving.
- **House rule:** when only one non-eliminated player remains, that player wins automatically.

Online-specific rules
- The host sets a turn time limit in the lobby (none / 60 / 90 / 120 / 180 s, default 120 s). When it runs out, the turn ends automatically. A disprover has 30 s; after that the server shows one of their matching cards at random.
- A disconnected player keeps their seat. If it is their turn or they must disprove, they get a 60 s grace period, after which their turn is skipped or a matching card is shown automatically.
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

Weapons: `candlestick`, `dagger`, `lead_pipe`, `revolver`, `rope`, `wrench`. Seat/turn order: red, yellow, white, green, blue, purple (`SEAT_ORDER`).
