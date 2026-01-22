// src/interfaces/providers/database.providers.ts

import { Provider } from '@nestjs/common';
import {
  createDrizzleClient,
  type DrizzleClient,
} from '../../infrastructure/database/drizzle';

/**
 * Token for Drizzle client injection
 */
export const DRIZZLE_CLIENT = Symbol('DrizzleClient');

/**
 * Provider for Drizzle client
 * Creates a unique instance of the database client
 */
export const drizzleClientProvider: Provider<DrizzleClient> = {
  provide: DRIZZLE_CLIENT,
  useFactory: (): DrizzleClient => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    return createDrizzleClient(connectionString);
  },
};
