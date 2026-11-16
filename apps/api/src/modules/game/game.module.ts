import { Module } from "@nestjs/common";
import { PresenceModule } from "../presence/index.js";
import { SessionModule } from "../session/index.js";
import { GameGateway } from "./game.gateway.js";
import { GameService } from "./game.service.js";
import {
  CONNECTION_CONTROL,
  GAME_NOTIFIER,
  SocketIoConnectionControl,
  SocketIoGameNotifier,
  SocketServerRef,
} from "./notifier/game.notifier.js";
import { StatePublisher } from "./notifier/state.publisher.js";
import { GameProjector } from "./projection/game.projector.js";
import { GAME_REPOSITORY, InMemoryGameRepository } from "./repository/game.repository.js";
import { DiceQueue, defaultRngFactory, RNG_FACTORY } from "./rng.js";
import { CLOCK, systemClock } from "./clock/clock.js";
import { TurnClock } from "./clock/turn-clock.js";

@Module({
  imports: [SessionModule, PresenceModule],
  providers: [
    { provide: GAME_REPOSITORY, useClass: InMemoryGameRepository },
    { provide: RNG_FACTORY, useValue: defaultRngFactory },
    { provide: GAME_NOTIFIER, useClass: SocketIoGameNotifier },
    { provide: CONNECTION_CONTROL, useClass: SocketIoConnectionControl },
    { provide: CLOCK, useValue: systemClock },
    SocketServerRef,
    DiceQueue,
    TurnClock,
    GameProjector,
    StatePublisher,
    GameService,
    GameGateway,
  ],
  exports: [GAME_REPOSITORY, DiceQueue, GameProjector, StatePublisher, GameService, TurnClock],
})
export class GameModule {}
