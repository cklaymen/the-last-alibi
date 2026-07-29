import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import { createRoomSchema, joinRoomSchema } from "@mystery-game/contracts";
import { RoomsService } from "./rooms.service.js";

@Controller()
export class RoomsController {
  public constructor(
    @Inject(RoomsService) private readonly roomsService: RoomsService,
  ) {}

  @Get("health")
  public health(): { status: "ok" } {
    return { status: "ok" };
  }

  @Post("rooms")
  public create(@Body() body: unknown) {
    return this.roomsService.create(createRoomSchema.parse(body));
  }

  @Post("rooms/join")
  @HttpCode(HttpStatus.OK)
  public join(@Body() body: unknown) {
    return this.roomsService.join(joinRoomSchema.parse(body));
  }
}
