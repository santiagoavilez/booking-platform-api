// src/infrastructure/services/jwt-token-verifier.spec.ts

import { JwtTokenVerifier } from './jwt-token-verifier';
import * as jwt from 'jsonwebtoken';

const mockJwtConfig = {
  secret: 'test-secret-key',
  expirationTime: '1h',
  refreshTokenExpirationTime: '7d',
};

describe('JwtTokenVerifier', () => {
  let verifier: JwtTokenVerifier;

  beforeEach(() => {
    verifier = new JwtTokenVerifier(mockJwtConfig);
  });

  describe('verify', () => {
    it('should return payload for valid token', async () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CLIENT' },
        mockJwtConfig.secret,
        { expiresIn: '1h' },
      );

      const result = await verifier.verify(token);

      expect(result.userId).toBe('user-123');
      expect(result.role).toBe('CLIENT');
      expect(result.iat).toBeDefined();
      expect(result.exp).toBeDefined();
    });

    it('should throw Token has expired for expired token', async () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CLIENT' },
        mockJwtConfig.secret,
        { expiresIn: '-1s' },
      );

      await expect(verifier.verify(token)).rejects.toThrow('Token has expired');
    });

    it('should throw Invalid token for malformed token', async () => {
      await expect(verifier.verify('invalid.token.here')).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should throw Invalid token for wrong secret', async () => {
      const token = jwt.sign(
        { userId: 'user-123', role: 'CLIENT' },
        'wrong-secret',
        { expiresIn: '1h' },
      );

      await expect(verifier.verify(token)).rejects.toThrow('Invalid token');
    });

    it('should throw Invalid token payload when userId is missing', async () => {
      const token = jwt.sign({ role: 'CLIENT' }, mockJwtConfig.secret, {
        expiresIn: '1h',
      });

      await expect(verifier.verify(token)).rejects.toThrow(
        'Invalid token payload',
      );
    });

    it('should throw Invalid token payload when role is missing', async () => {
      const token = jwt.sign({ userId: 'user-123' }, mockJwtConfig.secret, {
        expiresIn: '1h',
      });

      await expect(verifier.verify(token)).rejects.toThrow(
        'Invalid token payload',
      );
    });
  });
});
