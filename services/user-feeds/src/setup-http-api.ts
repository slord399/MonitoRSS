import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";
import compression from "@fastify/compress";

export async function setupHttpApi(): Promise<any> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "api/v",
  });

  await app.register(compression as any, { encodings: ["gzip", "deflate"] });

  return { app };
}
