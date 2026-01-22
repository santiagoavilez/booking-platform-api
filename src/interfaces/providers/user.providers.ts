// src/interfaces/providers/user.providers.ts

import { Provider } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { DrizzleUserRepository } from '../../infrastructure/database/repositories/drizzle-user.repository';
import { DRIZZLE_CLIENT } from './database.providers';
import type { DrizzleClient } from '../../infrastructure/database/drizzle';

/**
 * Token for user repository injection
 */
export const USER_REPOSITORY = Symbol('UserRepository');

/**
 * Provider for user repository
 * Connects IUserRepository interface with DrizzleUserRepository implementation
 */
export const userRepositoryProvider: Provider<IUserRepository> = {
  provide: USER_REPOSITORY,
  useFactory: (drizzleClient: DrizzleClient): IUserRepository => {
    return new DrizzleUserRepository(drizzleClient);
  },
  inject: [DRIZZLE_CLIENT],
};
