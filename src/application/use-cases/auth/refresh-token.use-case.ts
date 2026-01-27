// src/application/use-cases/auth/refresh-token.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { type IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { type IUserRepository } from '../../../domain/repositories/user.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
  JWT_TOKEN_GENERATOR,
  ID_GENERATOR,
  JWT_CONFIG,
} from '../../../interfaces/providers';
import type { IJwtTokenGenerator } from '../../../domain/services/jwt-token-generator.interface';
import type { IIdGenerator } from '../../../domain/services/id-generator.interface';
import type { JwtConfig } from '../../../interfaces/providers/config.providers';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { calculateRefreshTokenExpiration } from '../../../shared/utils/token-expiration.utils';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for refreshing JWT tokens
 * - Why: Separates token refresh logic from HTTP controller
 * - Responsibilities: Validate refresh token and generate new access token
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  token: string;
  expiresAt: number; // Unix timestamp in seconds
  refreshToken: string;
  refreshTokenExpiresAt: number; // Unix timestamp in seconds
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(JWT_TOKEN_GENERATOR)
    private readonly jwtTokenGenerator: IJwtTokenGenerator,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
    @Inject(JWT_CONFIG)
    private readonly jwtConfig: JwtConfig,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // 1. Find refresh token
    const refreshTokenEntity = await this.refreshTokenRepository.findByToken(
      input.refreshToken,
    );

    if (!refreshTokenEntity) {
      throw new Error('Invalid refresh token');
    }

    // 2. Validate refresh token (not expired, not revoked)
    if (!refreshTokenEntity.isValid()) {
      throw new Error('Invalid or expired refresh token');
    }

    // 3. Find user
    const user = await this.userRepository.findById(refreshTokenEntity.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // 4. Revoke old refresh token
    await this.refreshTokenRepository.revoke(input.refreshToken);

    // 5. Generate new access token
    const newAccessToken = await this.jwtTokenGenerator.generateToken(
      user.id,
      user.role,
    );

    // 6. Generate new refresh token
    const newRefreshTokenId = this.idGenerator.generate();
    const newRefreshTokenValue = this.idGenerator.generate(); // Use as token value
    const refreshTokenExpiresAt = calculateRefreshTokenExpiration(
      this.jwtConfig.refreshTokenExpirationTime,
    );

    const newRefreshTokenEntity = new RefreshToken(
      newRefreshTokenId,
      newRefreshTokenValue,
      user.id,
      refreshTokenExpiresAt,
      new Date(),
    );

    await this.refreshTokenRepository.create(newRefreshTokenEntity);

    // 7. Return new tokens and user data
    return {
      token: newAccessToken,
      expiresAt: this.jwtTokenGenerator.getExpirationTimestamp(),
      refreshToken: newRefreshTokenValue,
      refreshTokenExpiresAt: Math.floor(refreshTokenExpiresAt.getTime() / 1000),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
