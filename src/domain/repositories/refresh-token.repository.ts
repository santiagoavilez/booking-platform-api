import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * ARCHITECTURAL DECISION:
 * - What: Interface for refresh token repository
 * - Why: Defines contract for refresh token persistence
 * - Allows swapping implementations without changing use cases
 *
 * CLEAN ARCHITECTURE:
 * - Domain layer interface
 * - No infrastructure dependencies
 * - Defines what operations are needed, not how they're implemented
 */
export interface IRefreshTokenRepository {
  /**
   * Creates a new refresh token
   */
  create(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Finds a refresh token by its token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Finds all refresh tokens for a user
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Revokes a refresh token by setting revokedAt
   */
  revoke(token: string): Promise<void>;

  /**
   * Revokes all refresh tokens for a user
   */
  revokeAllForUser(userId: string): Promise<void>;

  /**
   * Deletes expired refresh tokens
   */
  deleteExpired(): Promise<void>;
}
