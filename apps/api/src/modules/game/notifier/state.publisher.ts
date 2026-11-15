import { Inject, Injectable } from "@nestjs/common";
import type { Game } from "@mystery-game/game";
import { GameProjector } from "../projection/game.projector.js";
import { GAME_NOTIFIER, type GameNotifier } from "./game.notifier.js";

/** Broadcasts projected states after a change. */
@Injectable()
export class StatePublisher {
  public constructor(
    @Inject(GAME_NOTIFIER) private readonly notifier: GameNotifier,
    @Inject(GameProjector) private readonly projector: GameProjector,
  ) {}

  public publish(game: Game): void {
    this.notifier.toRoom(game.roomCode, "room:state", this.projector.room(game));
    const pub = this.projector.publicState(game);
    if (!pub) return;
    this.notifier.toRoom(game.roomCode, "game:state", pub);
    for (const player of game.players) {
      const priv = this.projector.privateState(game, player.id);
      if (priv) this.notifier.toPlayer(player.id, "game:private", priv);
    }
  }
}
