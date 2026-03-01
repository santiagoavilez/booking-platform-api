// src/shared/utils/token-expiration.utils.spec.ts

import {
  parseExpirationTime,
  calculateRefreshTokenExpiration,
} from './token-expiration.utils';

describe('parseExpirationTime', () => {
  it('should parse seconds', () => {
    expect(parseExpirationTime('60s')).toBe(60);
    expect(parseExpirationTime('1s')).toBe(1);
  });

  it('should parse minutes', () => {
    expect(parseExpirationTime('30m')).toBe(30 * 60);
    expect(parseExpirationTime('1m')).toBe(60);
  });

  it('should parse hours', () => {
    expect(parseExpirationTime('24h')).toBe(24 * 60 * 60);
    expect(parseExpirationTime('1h')).toBe(3600);
  });

  it('should parse days', () => {
    expect(parseExpirationTime('7d')).toBe(7 * 24 * 60 * 60);
    expect(parseExpirationTime('1d')).toBe(86400);
  });

  it('should be case insensitive', () => {
    expect(parseExpirationTime('7D')).toBe(7 * 24 * 60 * 60);
    expect(parseExpirationTime('24H')).toBe(86400);
  });

  it('should trim whitespace', () => {
    expect(parseExpirationTime('  7d  ')).toBe(7 * 24 * 60 * 60);
  });

  it('should return 7 days in seconds for invalid format', () => {
    const sevenDays = 7 * 24 * 60 * 60;
    expect(parseExpirationTime('invalid')).toBe(sevenDays);
    expect(parseExpirationTime('')).toBe(sevenDays);
    expect(parseExpirationTime('7')).toBe(sevenDays);
    expect(parseExpirationTime('7x')).toBe(sevenDays);
  });
});

describe('calculateRefreshTokenExpiration', () => {
  it('should return a Date in the future', () => {
    const before = new Date();
    const result = calculateRefreshTokenExpiration('1h');
    const after = new Date();

    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime() + 3601000);
  });

  it('should add correct seconds for 7d', () => {
    const before = Date.now();
    const result = calculateRefreshTokenExpiration('7d');
    const expected = before + 7 * 24 * 60 * 60 * 1000;

    expect(result.getTime()).toBeGreaterThanOrEqual(expected - 100);
    expect(result.getTime()).toBeLessThanOrEqual(expected + 100);
  });
});
