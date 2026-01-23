// src/interfaces/providers/config.providers.ts

import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration interface for JWT settings
 * Following Clean Architecture: configuration is defined in interfaces layer
 */
export interface JwtConfig {
  secret: string;
  expirationTime: string;
  refreshTokenExpirationTime: string;
}

/**
 * Token for JWT configuration injection
 */
export const JWT_CONFIG = Symbol('JwtConfig');

/**
 * Provider for JWT configuration
 * Uses ConfigService to read environment variables
 * Validates that required values are present
 */
export const jwtConfigProvider: Provider<JwtConfig> = {
  provide: JWT_CONFIG,
  useFactory: (configService: ConfigService): JwtConfig => {
    const secret = configService.get<string>('JWT_SECRET');
    const expirationTime = configService.get<string>(
      'JWT_EXPIRATION_TIME',
      '1h',
    );
    const refreshTokenExpirationTime = configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      '7d',
    );

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return {
      secret,
      expirationTime,
      refreshTokenExpirationTime,
    };
  },
  inject: [ConfigService],
};
