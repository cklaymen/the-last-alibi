import { Module } from "@nestjs/common";
import { InMemorySessionRepository, SESSION_REPOSITORY } from "./session.repository.js";

@Module({
  providers: [{ provide: SESSION_REPOSITORY, useClass: InMemorySessionRepository }],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
