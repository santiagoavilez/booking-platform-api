// src/infrastructure/services/jwt-token-verifier.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  IJwtTokenVerifier,
  JwtPayload,
} from '../../domain/services/jwt-token-verifier.interface';
import {
  JWT_CONFIG,
  type JwtConfig,
} from '../../interfaces/providers/config.providers';
import * as jwt from 'jsonwebtoken';

/**
 * ARCHITECTURAL DECISION:
 * - What: JWT token verifier implementation
 * - Why: Implements domain interface using jsonwebtoken library
 * - Used by guards to verify incoming JWT tokens
 *
 * CLEAN ARCHITECTURE:
 * - Infrastructure layer implements domain interface
 * - Configuration is injected via DI
 */
@Injectable()
export class JwtTokenVerifier implements IJwtTokenVerifier {
  constructor(
    @Inject(JWT_CONFIG)
    private readonly jwtConfig: JwtConfig,
  ) {}

  async verify(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtConfig.secret) as JwtPayload;

      if (!decoded.userId || !decoded.role) {
        throw new Error('Invalid token payload');
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
  }
}
