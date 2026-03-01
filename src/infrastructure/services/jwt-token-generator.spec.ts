// src/infrastructure/services/jwt-token-generator.spec.ts

import { JwtTokenGenerator } from './jwt-token-generator';
import jwt from 'jsonwebtoken';

const mockJwtConfig = {
  secret: 'test-secret-key',
  expirationTime: '1h',
  refreshTokenExpirationTime: '7d',
};

describe('JwtTokenGenerator', () => {
  let generator: JwtTokenGenerator;

  beforeEach(() => {
    generator = new JwtTokenGenerator(mockJwtConfig);
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const token = await generator.generateToken('user-123', 'CLIENT');

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = jwt.verify(token, mockJwtConfig.secret) as {
        userId: string;
        role: string;
      };
      expect(decoded.userId).toBe('user-123');
      expect(decoded.role).toBe('CLIENT');
    });
  });

  describe('getExpirationTimestamp', () => {
    it('should return a timestamp in the future', () => {
      const now = Math.floor(Date.now() / 1000);
      const result = generator.getExpirationTimestamp();

      expect(result).toBeGreaterThan(now);
      expect(result).toBeLessThanOrEqual(now + 3601); // 1h + 1s buffer
    });

    it('should use expirationTime from config', () => {
      const generatorWith24h = new JwtTokenGenerator({
        ...mockJwtConfig,
        expirationTime: '24h',
      });

      const now = Math.floor(Date.now() / 1000);
      const result = generatorWith24h.getExpirationTimestamp();
      const expectedMax = now + 24 * 3600 + 1;

      expect(result).toBeGreaterThan(now);
      expect(result).toBeLessThanOrEqual(expectedMax);
    });
  });
});
