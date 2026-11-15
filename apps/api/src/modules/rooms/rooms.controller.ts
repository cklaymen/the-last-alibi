import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from "@nestjs/common";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeSchema,
  type RoomSessionResponse,
} from "@mystery-game/contracts";
import { AppError } from "../../shared/app-error.js";
import { parseOrThrow } from "../../shared/validation.js";
import { bearerToken } from "../session/index.js";
import { RoomsService, type RoomInfo } from "./rooms.service.js";

@Controller("rooms")
export class RoomsController {
  public constructor(@Inject(RoomsService) private readonly rooms: RoomsService) {}

  @Post()
  public create(@Body() body: unknown): RoomSessionResponse {
    const { playerName } = parseOrThrow(createRoomSchema, body);
    return this.rooms.create(playerName);
  }

  @Post("join")
  @HttpCode(HttpStatus.OK)
  public join(@Body() body: unknown): RoomSessionResponse {
    const { playerName, roomCode } = parseOrThrow(joinRoomSchema, body);
    return this.rooms.join(playerName, roomCode);
  }

  @Get(":code")
  public info(@Param("code") code: string): RoomInfo {
    const parsed = roomCodeSchema.safeParse(code);
    // A malformed code in a shared link simply does not exist.
    if (!parsed.success) throw new AppError("ROOM_NOT_FOUND");
    return this.rooms.info(parsed.data);
  }

  @Get(":code/session")
  public restore(
    @Param("code") code: string,
    @Headers("authorization") authorization: string | undefined,
  ): RoomSessionResponse {
    const roomCode = parseOrThrow(roomCodeSchema, code);
    return this.rooms.restore(roomCode, bearerToken(authorization));
  }
}
