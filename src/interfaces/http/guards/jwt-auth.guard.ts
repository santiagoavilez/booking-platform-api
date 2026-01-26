// src/interfaces/http/guards/jwt-auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as JwtVerifier from '../../../domain/services/jwt-token-verifier.interface';
import { JWT_TOKEN_VERIFIER } from '../../providers/services.providers';

/**
 * ARCHITECTURAL DECISION:
 * - What: NestJS Guard for JWT authentication
 * - Why: Protects routes requiring authentication
 * - Extracts user info from JWT and attaches to request
 *
 * CLEAN ARCHITECTURE:
 * - Located in Interfaces layer (HTTP adapter)
 * - Depends on domain interface (IJwtTokenVerifier)
 * - Implementation details (token extraction, request modification) are HTTP-specific
 *
 * USAGE:
 * @UseGuards(JwtAuthGuard)
 * @Post('protected-route')
 * async protectedRoute(@Req() req: AuthenticatedRequest) {
 *   const userId = req.user.userId;
 * }
 */

/**
 * Extended Request interface with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user: JwtVerifier.JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_TOKEN_VERIFIER)
    private readonly jwtTokenVerifier: JwtVerifier.IJwtTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await this.jwtTokenVerifier.verify(token);

      // Attach user payload to request for use in controllers
      (request as AuthenticatedRequest).user = payload;

      return true;
    } catch (error) {
      const message = (error as Error).message;

      if (message === 'Token has expired') {
        throw new UnauthorizedException('Token has expired');
      }

      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Extracts JWT token from Authorization header
   * Expected format: "Bearer <token>"
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
