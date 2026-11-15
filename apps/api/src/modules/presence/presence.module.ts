import { Module } from "@nestjs/common";
import { PRESENCE_OPTIONS, presenceOptionsFromEnv } from "./presence.options.js";
import { PresenceRegistry } from "./presence.registry.js";
import { systemTimer, TIMER } from "./timer.js";

@Module({
  providers: [
    { provide: TIMER, useValue: systemTimer },
    { provide: PRESENCE_OPTIONS, useFactory: () => presenceOptionsFromEnv() },
    PresenceRegistry,
  ],
  exports: [PresenceRegistry],
})
export class PresenceModule {}
