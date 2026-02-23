/**
 * E2E Test Setup
 *
 * Loads .env.test before any test imports run.
 * Ensures process.env.DATABASE_URL points to the test database
 * when AppModule and Drizzle providers initialize.
 */
import { config } from 'dotenv';

config({ path: '.env.test', override: true });
