import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { AppModule } from '../../src/app.module';
import { DRIZZLE_CLIENT } from '../../src/interfaces/providers/database.providers';
import type { DrizzleClient } from '../../src/infrastructure/database/drizzle';

export interface TestAppContext {
  app: INestApplication;
  db: DrizzleClient;
}

/**
 * Initialize a test application with test database configuration.
 * Applies ValidationPipe to match main.ts behavior (required for DTO validation).
 */
export async function initTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const db = moduleFixture.get<DrizzleClient>(DRIZZLE_CLIENT);

  return { app, db };
}

/**
 * Clean up resources used by the test app.
 */
export async function closeTestApp(context: TestAppContext): Promise<void> {
  const { app } = context;
  await resetTestApp(context);
  await app.close();
}

/**
 * Reset the test database state between tests.
 * Truncates all tables to ensure each test is idempotent.
 * Order respects FK dependencies (child tables first).
 */
export async function resetTestApp(context: TestAppContext): Promise<void> {
  const { db } = context;
  await db.execute(
    sql`TRUNCATE refresh_tokens, appointments, notifications, availability, users RESTART IDENTITY CASCADE`,
  );
}
