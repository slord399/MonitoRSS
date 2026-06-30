import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ModuleMetadata } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { config } from "../../config";
import { EntityName, MikroORM } from "@mikro-orm/core";
import { randomUUID } from "crypto";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { TestingModule } from "@nestjs/testing";

let testingModule: TestingModule;
let orm: MikroORM;
const postgresSchema = randomUUID().replace(/-/g, "");

interface Options {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  models?: EntityName<Partial<any>>[];
  withApi?: boolean;
}

export async function setupIntegrationTests(
  metadata: ModuleMetadata,
  options?: Options
): Promise<any> {
  const configVals = config();

  const { Test } = await import("@nestjs/testing");

  const uncompiledModule = Test.createTestingModule({
    ...metadata,
    imports: [
      ...(metadata.imports || []),
      ConfigModule.forRoot({
        ignoreEnvFile: true,
        load: [config],
        isGlobal: true,
      }),
      MikroOrmModule.forFeature(options?.models || []),
      MikroOrmModule.forRoot({
        driver: require('@mikro-orm/postgresql').PostgreSqlDriver,
        entities: ["dist/**/*.entity.js"],
        entitiesTs: ["src/**/*.entity.ts"],
        clientUrl: configVals.USER_FEEDS_POSTGRES_URI,
        dbName: configVals.USER_FEEDS_POSTGRES_DATABASE,
        forceUtcTimezone: true,
        timezone: "UTC",
        schema: postgresSchema,
        allowGlobalContext: true,
      }),
    ],
  });

  const init = async () => {
    testingModule = await uncompiledModule.compile();

    const fastifyApp =
      testingModule.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter()
      );

    await fastifyApp.init();
    await fastifyApp.getHttpAdapter().getInstance().ready();

    orm = testingModule.get(MikroORM);
    await clearDatabase();

    return {
      module: testingModule,
      fastifyApp,
    };
  };

  return {
    uncompiledModule,
    init,
  };
}

export async function clearDatabase() {
  const generator =  (orm as any)?.getSchemaGenerator();
  await generator.ensureDatabase();
  await generator.dropSchema();
  await generator.createSchema();
}

export async function teardownIntegrationTests() {
  if (orm) {
    const generator =  (orm as any).getSchemaGenerator();
    await generator.dropSchema();
    await (orm.em as any).transactional(async (em: any) => {
      await em.execute(
        `DROP SCHEMA IF EXISTS "${postgresSchema}" CASCADE`
      );
    });

    await orm.close();
  }

  await testingModule?.close();
}
