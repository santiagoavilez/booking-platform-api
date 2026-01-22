// src/infrastructure/database/drizzle/index.ts

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * ARCHITECTURAL DECISION:
 * - What: Drizzle client configured with PostgreSQL connection
 * - Why: Centralizes database configuration
 * - Injected into repositories via Dependency Injection
 */
export const createDrizzleClient = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
  });

  return drizzle(pool, { schema });
};

export type DrizzleClient = ReturnType<typeof createDrizzleClient>;
