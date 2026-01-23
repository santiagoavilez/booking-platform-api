/**
 * ARCHITECTURAL DECISION:
 * - What: RefreshToken domain entity
 * - Why: Represents a refresh token in the domain layer
 * - Responsibilities: Encapsulates refresh token business logic
 *
 * CLEAN ARCHITECTURE:
 * - Pure domain entity, no infrastructure dependencies
 * - Contains business rules and validation
 */
export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null = null,
  ) {}

  /**
   * Checks if the refresh token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Checks if the refresh token is revoked
   */
  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  /**
   * Checks if the refresh token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }
}
