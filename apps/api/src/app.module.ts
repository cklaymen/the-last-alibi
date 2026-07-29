import { Module } from "@nestjs/common";
import { LobbyGateway } from "./rooms/lobby.gateway.js";
import { RoomsController } from "./rooms/rooms.controller.js";
import { RoomsService } from "./rooms/rooms.service.js";

@Module({
  controllers: [RoomsController],
  providers: [LobbyGateway, RoomsService],
})
export class AppModule {}
