/**
 * ARCHITECTURAL DECISION:
 * - What: Interface for JWT token generation
 * - Why: Separates JWT generation from technical implementation (jsonwebtoken)
 * - Allows changing from jsonwebtoken to another library without modifying use cases
 * - Implementation will be in Infrastructure layer
 */
export interface IJwtTokenGenerator {
  /**
   * Generates a JWT token
   * @param userId - User ID
   * @param role - User role
   * @returns JWT token
   */
  generateToken(userId: string, role: string): Promise<string>;

  /**
   * Gets the expiration timestamp for tokens
   * @returns Unix timestamp in seconds when the token will expire
   */
  getExpirationTimestamp(): number;
}
