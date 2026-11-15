import { Body, Controller, HttpCode, HttpStatus, Inject, Param, Post } from "@nestjs/common";
import { scenarioSchema } from "@mystery-game/contracts";
import { parseOrThrow } from "../../shared/validation.js";
import { DiceQueue, GameService } from "../game/index.js";
import { applyScenario } from "./scenario.js";

/** Test-only endpoints; the module is registered only when ENABLE_TEST_API=1. */
@Controller("testing")
export class TestingController {
  public constructor(
    @Inject(GameService) private readonly games: GameService,
    @Inject(DiceQueue) private readonly diceQueue: DiceQueue,
  ) {}

  @Post("rooms/:code/scenario")
  @HttpCode(HttpStatus.OK)
  public scenario(@Param("code") code: string, @Body() body: unknown): { ok: true } {
    const scenario = parseOrThrow(scenarioSchema, body);
    const game = applyScenario(this.games.load(code), scenario);
    if (scenario.dice) this.diceQueue.enqueue(code, scenario.dice);
    this.games.commit(game);
    return { ok: true };
  }
}
