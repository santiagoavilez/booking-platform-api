// src/shared/utils/token-expiration.utils.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: Utility functions for token expiration calculation
 * - Why: Centralizes expiration logic to avoid duplication in use cases (DRY principle)
 * - Benefits: Single point of maintenance, easier testing, follows SRP
 */

/**
 * Parses expiration time string (e.g., "7d", "24h", "3600s") to seconds
 *
 * @param expirationTime - Time string with format: number + unit (s/m/h/d)
 * @returns Number of seconds
 *
 * @example
 * parseExpirationTime("7d")  // Returns 604800 (7 days in seconds)
 * parseExpirationTime("24h") // Returns 86400 (24 hours in seconds)
 * parseExpirationTime("30m") // Returns 1800 (30 minutes in seconds)
 * parseExpirationTime("60s") // Returns 60 (60 seconds)
 */
export function parseExpirationTime(expirationTime: string): number {
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

/**
 * Calculates refresh token expiration date based on configuration string
 *
 * @param expirationTimeConfig - Time string (e.g., "7d", "24h")
 * @returns Date object representing when the token will expire
 *
 * @example
 * const expiresAt = calculateRefreshTokenExpiration("7d");
 * // Returns a Date 7 days in the future
 */
export function calculateRefreshTokenExpiration(
  expirationTimeConfig: string,
): Date {
  const expirationTimeInSeconds = parseExpirationTime(expirationTimeConfig);
  const expirationDate = new Date();
  expirationDate.setTime(
    expirationDate.getTime() + expirationTimeInSeconds * 1000,
  );
  return expirationDate;
}

