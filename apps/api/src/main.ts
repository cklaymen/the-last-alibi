import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule.forRoot({ enableTestApi: process.env.ENABLE_TEST_API === "1" }),
  );
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
