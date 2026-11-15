import { Module } from "@nestjs/common";
import { GameModule } from "../game/index.js";
import { SessionModule } from "../session/index.js";
import { RoomsController } from "./rooms.controller.js";
import { RoomsService } from "./rooms.service.js";

@Module({
  imports: [SessionModule, GameModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
