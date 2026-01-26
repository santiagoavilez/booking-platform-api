// src/domain/services/jwt-token-verifier.interface.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: Interface for JWT token verification
 * - Why: Separates token verification from technical implementation
 * - Allows changing JWT library without modifying guards or use cases
 * - Implementation will be in Infrastructure layer
 *
 * CLEAN ARCHITECTURE:
 * - Domain defines the contract (this interface)
 * - Infrastructure implements it (using jsonwebtoken)
 * - Interfaces layer (guards) depends on this interface
 */

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface IJwtTokenVerifier {
  /**
   * Verifies a JWT token and returns the payload
   * @param token - JWT token to verify
   * @returns Decoded payload if valid
   * @throws Error if token is invalid or expired
   */
  verify(token: string): Promise<JwtPayload>;
}

