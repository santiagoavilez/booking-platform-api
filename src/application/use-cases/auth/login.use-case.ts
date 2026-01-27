// src/application/use-cases/auth/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { type IUserRepository } from '../../../domain/repositories/user.repository';
import { type IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import {
  USER_REPOSITORY,
  JWT_TOKEN_GENERATOR,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  ID_GENERATOR,
  JWT_CONFIG,
} from '../../../interfaces/providers';
import type { IJwtTokenGenerator } from '../../../domain/services/jwt-token-generator.interface';
import type { IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import type { IIdGenerator } from '../../../domain/services/id-generator.interface';
import type { JwtConfig } from '../../../interfaces/providers/config.providers';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { calculateRefreshTokenExpiration } from '../../../shared/utils/token-expiration.utils';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for user authentication
 * - Why: Separates authentication logic from HTTP controller
 * - Responsibilities: Validate credentials and generate JWT token
 */
export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
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
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(JWT_TOKEN_GENERATOR)
    private readonly jwtTokenGenerator: IJwtTokenGenerator,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY as symbol)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
    @Inject(JWT_CONFIG)
    private readonly jwtConfig: JwtConfig,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify password (will be implemented with infrastructure service)
    const isValidPassword = await this.passwordHasher.compare(
      input.password,
      user.getPasswordHash(),
    );
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate JWT token
    const token = await this.jwtTokenGenerator.generateToken(
      user.id,
      user.role,
    );

    // 4. Generate refresh token
    const refreshTokenId = this.idGenerator.generate();
    const refreshTokenValue = this.idGenerator.generate();
    const refreshTokenExpiresAt = calculateRefreshTokenExpiration(
      this.jwtConfig.refreshTokenExpirationTime,
    );

    const refreshTokenEntity = new RefreshToken(
      refreshTokenId,
      refreshTokenValue,
      user.id,
      refreshTokenExpiresAt,
      new Date(),
    );

    await this.refreshTokenRepository.create(refreshTokenEntity);

    // 5. Return tokens and user data
    return {
      token,
      expiresAt: this.jwtTokenGenerator.getExpirationTimestamp(),
      refreshToken: refreshTokenValue,
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
