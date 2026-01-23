// src/interfaces/providers/refresh-token.providers.ts

import { Provider } from '@nestjs/common';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { DrizzleRefreshTokenRepository } from '../../infrastructure/database/repositories/drizzle-refresh-token.repository';
import { DRIZZLE_CLIENT } from './database.providers';
import type { DrizzleClient } from '../../infrastructure/database/drizzle';

/**
 * Token for refresh token repository injection
 */
export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');

/**
 * Provider for refresh token repository
 * Connects IRefreshTokenRepository interface with DrizzleRefreshTokenRepository implementation
 */
export const refreshTokenRepositoryProvider: Provider<IRefreshTokenRepository> =
  {
    provide: REFRESH_TOKEN_REPOSITORY,
    useFactory: (drizzleClient: DrizzleClient): IRefreshTokenRepository => {
      return new DrizzleRefreshTokenRepository(drizzleClient);
    },
    inject: [DRIZZLE_CLIENT],
  };
