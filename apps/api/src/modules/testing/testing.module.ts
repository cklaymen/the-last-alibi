import { Module } from "@nestjs/common";
import { GameModule } from "../game/index.js";
import { TestingController } from "./testing.controller.js";

@Module({
  imports: [GameModule],
  controllers: [TestingController],
})
export class TestingModule {}
