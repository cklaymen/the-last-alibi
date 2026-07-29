import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms/rooms.controller.js";
import { RoomsService } from "./rooms/rooms.service.js";

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class AppModule {}
