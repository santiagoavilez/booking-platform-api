import { Inject, Injectable } from '@nestjs/common';
import { IJwtTokenGenerator } from '../../domain/services/jwt-token-generator.interface';
import {
  JWT_CONFIG,
  type JwtConfig,
} from '../../interfaces/providers/config.providers';
import * as jwt from 'jsonwebtoken';

/**
 * ARCHITECTURAL DECISION:
 * - What: JWT token generator implementation
 * - Why: Implements domain interface using jsonwebtoken library
 * - Configuration is injected via DI, not accessed directly from process.env
 * - Maintains Clean Architecture: infrastructure depends on domain interface
 */
@Injectable()
export class JwtTokenGenerator implements IJwtTokenGenerator {
  constructor(
    @Inject(JWT_CONFIG)
    private readonly jwtConfig: JwtConfig,
  ) {}

  generateToken(userId: string, role: string): Promise<string> {
    try {
      const token = jwt.sign({ userId, role }, this.jwtConfig.secret, {
        expiresIn: this.jwtConfig.expirationTime,
      } as jwt.SignOptions);
      return Promise.resolve(token);
    } catch (error) {
      return Promise.reject(
        new Error(`Failed to generate JWT token: ${(error as Error).message}`),
      );
    }
  }

  getExpirationTimestamp(): number {
    const expirationTimeInSeconds = this.parseExpirationTime(
      this.jwtConfig.expirationTime,
    );
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return nowInSeconds + expirationTimeInSeconds;
  }

  /**
   * Parses expiration time string (e.g., "24h", "1h", "3600s") to seconds
   * @param expirationTime - Expiration time string
   * @returns Expiration time in seconds
   */
  private parseExpirationTime(expirationTime: string): number {
    const timeStr = expirationTime.trim().toLowerCase();
    const match = timeStr.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 24 hours if format is invalid
      return 24 * 60 * 60;
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
        return 24 * 60 * 60; // Default to 24 hours
    }
  }
}
