/**
 * ARCHITECTURAL DECISION:
 * - What: Interface for password hashing service
 * - Why: Separates hashing logic from technical implementation (bcrypt)
 * - Allows changing from bcrypt to another library without modifying use cases
 * - Implementation will be in Infrastructure layer
 */
export interface IPasswordHasher {
  /**
    @param password - Plain text password
    * @returns Password hash
    */
  hash(password: string): Promise<string>;

  /**
  * Verifies if a password matches a hash
  @param password - Plain text password
  @param hash - Stored hash
  @returns true if they match, false otherwise
  */
  compare(password: string, hash: string): Promise<boolean>;
}
