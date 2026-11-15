import { Controller, Get, Module, type DynamicModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GameModule } from "./modules/game/index.js";
import { RoomsModule } from "./modules/rooms/rooms.module.js";
import { SessionModule } from "./modules/session/index.js";
import { TestingModule } from "./modules/testing/testing.module.js";
import { HttpErrorFilter } from "./shared/http-exception.filter.js";

@Controller()
class HealthController {
  @Get("health")
  public health(): { status: "ok" } {
    return { status: "ok" };
  }
}

export interface AppOptions {
  /** Registers `modules/testing` (scenario endpoint). Never enable in production. */
  readonly enableTestApi: boolean;
}

@Module({})
export class AppModule {
  public static forRoot(options: AppOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        SessionModule,
        GameModule,
        RoomsModule,
        ...(options.enableTestApi ? [TestingModule] : []),
      ],
      controllers: [HealthController],
      providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
    };
  }
}
