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
    const refreshTokenEntity =
      await this.refreshTokenRepository.findByToken(input.refreshToken);

    if (!refreshTokenEntity) {
      throw new Error('Invalid refresh token');
    }

    // 2. Validate refresh token (not expired, not revoked)
    if (!refreshTokenEntity.isValid()) {
      throw new Error('Invalid or expired refresh token');
    }

    // 3. Find user
    const user = await this.userRepository.findById(
      refreshTokenEntity.userId,
    );

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
    const refreshTokenExpiresAt = this.calculateRefreshTokenExpiration();

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
      },
    };
  }

  /**
   * Calculates refresh token expiration date based on configuration
   */
  private calculateRefreshTokenExpiration(): Date {
    const expirationTime = this.parseExpirationTime(
      this.jwtConfig.refreshTokenExpirationTime,
    );
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + expirationTime * 1000);
    return expirationDate;
  }

  /**
   * Parses expiration time string (e.g., "7d", "24h", "3600s") to seconds
   */
  private parseExpirationTime(expirationTime: string): number {
    const timeStr = expirationTime.trim().toLowerCase();
    const match = timeStr.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days if format is invalid
      return 7 * 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60; // Default to 7 days
    }
  }
}
