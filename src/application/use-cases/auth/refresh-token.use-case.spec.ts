// src/application/use-cases/auth/refresh-token.use-case.spec.ts

/**
 * UNIT TESTS FOR RefreshTokenUseCase
 *
 * TESTING STRATEGY:
 * We use MOCKS instead of a real database because:
 * 1. Unit tests must be ISOLATED - we only test the use case
 * 2. Tests must be FAST - no database connection
 * 3. Tests must be DETERMINISTIC - we control exactly what mocks return
 * 4. We follow Clean Architecture - use case depends on INTERFACES, not implementations
 *
 * PATTERN AAA (Arrange-Act-Assert):
 * - ARRANGE: Prepare data and configure mocks
 * - ACT: Execute the method under test
 * - ASSERT: Verify the result is as expected
 */

import {
  RefreshTokenUseCase,
  RefreshTokenInput,
  RefreshTokenOutput,
} from './refresh-token.use-case';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IJwtTokenGenerator } from '../../../domain/services/jwt-token-generator.interface';
import { IIdGenerator } from '../../../domain/services/id-generator.interface';
import { JwtConfig } from '../../../interfaces/providers/config.providers';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/enums/role.enum';

/**
 * EXPLANATION OF MOCKS:
 *
 * A MOCK is a "fake" object that simulates the behavior of a real dependency.
 *
 * For RefreshTokenUseCase, we mock:
 * - IRefreshTokenRepository: to simulate refresh token database operations
 * - IUserRepository: to simulate user lookup
 * - IJwtTokenGenerator: to simulate JWT token generation
 * - IIdGenerator: to simulate ID generation for new refresh tokens
 * - JwtConfig: to provide configuration values
 *
 * jest.fn() creates a "spy function" that:
 * 1. Records how many times it was called
 * 2. Records with what arguments it was called
 * 3. Allows defining what value it should return (with mockResolvedValue or mockReturnValue)
 */
describe('RefreshTokenUseCase', () => {
  // ============================================================
  // GLOBAL ARRANGE - Variables we'll use in all tests
  // ============================================================

  /**
   * The use case we're testing
   */
  let refreshTokenUseCase: RefreshTokenUseCase;

  /**
   * Mocks of use case dependencies
   *
   * jest.Mocked<T> is a type indicating it's a mocked version of T
   * This gives us autocomplete and type safety
   */
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockJwtTokenGenerator: jest.Mocked<IJwtTokenGenerator>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockJwtConfig: JwtConfig;

  /**
   * Individual mock functions for assertions
   *
   * WHY SEPARATE VARIABLES?
   * ESLint rule @typescript-eslint/unbound-method warns when you pass a method
   * separated from its object (e.g., expect(obj.method)) because if the method
   * uses 'this', it would lose its context.
   *
   * By storing jest.fn() in separate variables, we avoid this warning because
   * we're passing a standalone function reference, not an object method.
   */
  let mockFindByToken: jest.MockedFunction<
    IRefreshTokenRepository['findByToken']
  >;
  let mockRevoke: jest.MockedFunction<IRefreshTokenRepository['revoke']>;
  let mockCreateRefreshToken: jest.MockedFunction<
    IRefreshTokenRepository['create']
  >;
  let mockFindUserById: jest.MockedFunction<IUserRepository['findById']>;
  let mockGenerateToken: jest.MockedFunction<
    IJwtTokenGenerator['generateToken']
  >;
  let mockGetExpirationTimestamp: jest.MockedFunction<
    IJwtTokenGenerator['getExpirationTimestamp']
  >;
  let mockIdGenerate: jest.MockedFunction<IIdGenerator['generate']>;

  /**
   * Test data constants - reusable across all tests
   */
  const testUserId = 'user-123';
  const testEmail = 'test@example.com';
  const testPasswordHash = 'hashed_password_123';
  const testFirstName = 'John';
  const testLastName = 'Doe';
  const testRole = Role.CLIENT;

  const testOldRefreshTokenId = 'old-refresh-token-id';
  const testOldRefreshTokenValue = 'old-refresh-token-value';
  const testNewRefreshTokenId = 'new-refresh-token-id';
  const testNewRefreshTokenValue = 'new-refresh-token-value';
  const testNewJwtToken = 'new.jwt.token.here';
  const testExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  /**
   * Helper function to create a test user
   * @returns A User entity with test data
   */
  const createTestUser = (): User => {
    return new User(
      testUserId,
      testEmail,
      testPasswordHash,
      testRole,
      testFirstName,
      testLastName,
    );
  };

  /**
   * Helper function to create a valid refresh token (not expired, not revoked)
   * @returns A valid RefreshToken entity
   */
  const createValidRefreshToken = (): RefreshToken => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Expires in 7 days

    return new RefreshToken(
      testOldRefreshTokenId,
      testOldRefreshTokenValue,
      testUserId,
      futureDate, // expiresAt - future date (not expired)
      new Date(), // createdAt - now
      null, // revokedAt - null (not revoked)
    );
  };

  /**
   * Helper function to create an expired refresh token
   * @returns An expired RefreshToken entity
   */
  const createExpiredRefreshToken = (): RefreshToken => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Expired 1 day ago

    return new RefreshToken(
      testOldRefreshTokenId,
      testOldRefreshTokenValue,
      testUserId,
      pastDate, // expiresAt - past date (expired)
      new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // createdAt - 8 days ago
      null, // revokedAt - null (not revoked, but expired)
    );
  };

  /**
   * Helper function to create a revoked refresh token
   * @returns A revoked RefreshToken entity
   */
  const createRevokedRefreshToken = (): RefreshToken => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Would expire in 7 days

    return new RefreshToken(
      testOldRefreshTokenId,
      testOldRefreshTokenValue,
      testUserId,
      futureDate, // expiresAt - future date (would be valid)
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // createdAt - 1 day ago
      new Date(), // revokedAt - now (revoked!)
    );
  };

  /**
   * Helper function to create the new refresh token that will be returned by create()
   *
   * WHY WE NEED THIS:
   * The IRefreshTokenRepository.create() method returns Promise<RefreshToken>,
   * not Promise<void>. So our mock must return a valid RefreshToken entity
   * to comply with the interface contract.
   *
   * @returns A new RefreshToken entity representing the created token
   */
  const createNewRefreshTokenEntity = (): RefreshToken => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Expires in 7 days

    return new RefreshToken(
      testNewRefreshTokenId,
      testNewRefreshTokenValue,
      testUserId,
      futureDate, // expiresAt
      new Date(), // createdAt
      null, // revokedAt - null (not revoked)
    );
  };

  // ============================================================
  // beforeEach - Runs BEFORE each test
  // ============================================================
  /**
   * beforeEach:
   * - Runs before EACH test (it)
   * - Here we reset all mocks so each test starts "clean"
   * - This prevents one test from affecting another
   */
  beforeEach(() => {
    /**
     * Create individual mock functions first
     * This avoids the @typescript-eslint/unbound-method ESLint error
     */

    // RefreshTokenRepository mock functions
    mockFindByToken = jest.fn();
    mockRevoke = jest.fn();
    mockCreateRefreshToken = jest.fn();

    // UserRepository mock functions
    mockFindUserById = jest.fn();

    // JwtTokenGenerator mock functions
    mockGenerateToken = jest.fn();
    mockGetExpirationTimestamp = jest.fn();

    // IdGenerator mock function
    mockIdGenerate = jest.fn();

    // Assemble RefreshTokenRepository mock
    mockRefreshTokenRepository = {
      findByToken: mockFindByToken,
      findByUserId: jest.fn(),
      create: mockCreateRefreshToken,
      revoke: mockRevoke,
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };

    // Assemble UserRepository mock
    mockUserRepository = {
      findById: mockFindUserById,
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    // Assemble JwtTokenGenerator mock
    mockJwtTokenGenerator = {
      generateToken: mockGenerateToken,
      getExpirationTimestamp: mockGetExpirationTimestamp,
    };

    // Assemble IdGenerator mock
    mockIdGenerator = {
      generate: mockIdGenerate,
    };

    // JWT Config mock with test values
    mockJwtConfig = {
      secret: 'test-secret',
      expirationTime: '1h',
      refreshTokenExpirationTime: '7d',
    };

    /**
     * Create the use case with mocked dependencies
     *
     * Normally NestJS does this automatically with DI (Dependency Injection)
     * In tests, we do it manually by passing the mocks
     */
    refreshTokenUseCase = new RefreshTokenUseCase(
      mockRefreshTokenRepository,
      mockUserRepository,
      mockJwtTokenGenerator,
      mockIdGenerator,
      mockJwtConfig,
    );
  });

  // ============================================================
  // TESTS
  // ============================================================
  describe('execute', () => {
    // ----------------------------------------------------------
    // TEST 1: Happy Path - Successful token refresh
    // ----------------------------------------------------------
    describe('Happy Path - Successful Token Refresh', () => {
      it('should return new tokens when refresh token is valid', async () => {
        // ========== ARRANGE ==========
        // Configure mocks to simulate successful token refresh

        // 1. Valid refresh token exists
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        // 2. User exists
        const testUser = createTestUser();
        mockFindUserById.mockResolvedValue(testUser);

        // 3. Revoke old token succeeds
        mockRevoke.mockResolvedValue(undefined);

        // 4. New JWT token generation succeeds
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        // 5. ID generator returns new IDs (called twice: for token ID and token value)
        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        /**
         * 6. Create new refresh token succeeds
         *
         * IMPORTANT: mockResolvedValue must return a RefreshToken, not undefined!
         * The interface defines: create(refreshToken: RefreshToken): Promise<RefreshToken>
         * Returning undefined would violate the interface contract.
         */
        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        // Input data
        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        const result: RefreshTokenOutput =
          await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========

        // Verify the new access token is returned
        expect(result.token).toBe(testNewJwtToken);
        expect(result.expiresAt).toBe(testExpirationTimestamp);

        // Verify the new refresh token is returned
        expect(result.refreshToken).toBe(testNewRefreshTokenValue);
        expect(result.refreshTokenExpiresAt).toBeGreaterThan(
          Math.floor(Date.now() / 1000),
        );

        // Verify user data is returned correctly
        expect(result.user).toEqual({
          id: testUserId,
          email: testEmail,
          role: testRole,
          firstName: testFirstName,
          lastName: testLastName,
        });

        // Verify mocks were called with correct arguments
        expect(mockFindByToken).toHaveBeenCalledTimes(1);
        expect(mockFindByToken).toHaveBeenCalledWith(testOldRefreshTokenValue);

        expect(mockFindUserById).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).toHaveBeenCalledWith(testUserId);

        expect(mockRevoke).toHaveBeenCalledTimes(1);
        expect(mockRevoke).toHaveBeenCalledWith(testOldRefreshTokenValue);

        expect(mockGenerateToken).toHaveBeenCalledTimes(1);
        expect(mockGenerateToken).toHaveBeenCalledWith(testUserId, testRole);

        expect(mockIdGenerate).toHaveBeenCalledTimes(2);
        expect(mockCreateRefreshToken).toHaveBeenCalledTimes(1);
      });

      it('should create new refresh token with correct data', async () => {
        // ========== ARRANGE ==========
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        const testUser = createTestUser();
        mockFindUserById.mockResolvedValue(testUser);

        mockRevoke.mockResolvedValue(undefined);
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========
        /**
         * Verify that create() was called with a RefreshToken that has:
         * - The new ID generated by idGenerator
         * - The new token value generated by idGenerator
         * - The correct userId
         */
        expect(mockCreateRefreshToken).toHaveBeenCalledWith(
          expect.objectContaining({
            id: testNewRefreshTokenId,
            token: testNewRefreshTokenValue,
            userId: testUserId,
          }),
        );
      });
    });

    // ----------------------------------------------------------
    // TEST 2: Error Cases - Token Not Found
    // ----------------------------------------------------------
    describe('Error Cases - Token Not Found', () => {
      it('should throw error when refresh token is not found', async () => {
        // ========== ARRANGE ==========
        // Refresh token does not exist in database
        mockFindByToken.mockResolvedValue(null);

        const input: RefreshTokenInput = {
          refreshToken: 'non-existent-token',
        };

        // ========== ACT & ASSERT ==========
        await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
          'Invalid refresh token',
        );

        // Verify that subsequent operations were NOT called
        expect(mockFindByToken).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockRevoke).not.toHaveBeenCalled();
        expect(mockGenerateToken).not.toHaveBeenCalled();
      });
    });

    // ----------------------------------------------------------
    // TEST 3: Error Cases - Expired Token
    // ----------------------------------------------------------
    describe('Error Cases - Expired Token', () => {
      it('should throw error when refresh token is expired', async () => {
        // ========== ARRANGE ==========
        // Token exists but is expired
        const expiredToken = createExpiredRefreshToken();
        mockFindByToken.mockResolvedValue(expiredToken);

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT & ASSERT ==========
        await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
          'Invalid or expired refresh token',
        );

        // Verify token was looked up but user was NOT fetched
        expect(mockFindByToken).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockRevoke).not.toHaveBeenCalled();
      });
    });

    // ----------------------------------------------------------
    // TEST 4: Error Cases - Revoked Token
    // ----------------------------------------------------------
    describe('Error Cases - Revoked Token', () => {
      it('should throw error when refresh token is revoked', async () => {
        // ========== ARRANGE ==========
        // Token exists but has been revoked
        const revokedToken = createRevokedRefreshToken();
        mockFindByToken.mockResolvedValue(revokedToken);

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT & ASSERT ==========
        await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
          'Invalid or expired refresh token',
        );

        // Verify token was looked up but user was NOT fetched
        expect(mockFindByToken).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).not.toHaveBeenCalled();
        expect(mockRevoke).not.toHaveBeenCalled();
      });
    });

    // ----------------------------------------------------------
    // TEST 5: Error Cases - User Not Found
    // ----------------------------------------------------------
    describe('Error Cases - User Not Found', () => {
      it('should throw error when user associated with token is not found', async () => {
        // ========== ARRANGE ==========
        // Valid token exists but user does not
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        // User not found (perhaps deleted)
        mockFindUserById.mockResolvedValue(null);

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT & ASSERT ==========
        await expect(refreshTokenUseCase.execute(input)).rejects.toThrow(
          'User not found',
        );

        // Verify token was looked up and user lookup was attempted
        expect(mockFindByToken).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).toHaveBeenCalledTimes(1);
        expect(mockFindUserById).toHaveBeenCalledWith(testUserId);

        // Verify no tokens were revoked or generated
        expect(mockRevoke).not.toHaveBeenCalled();
        expect(mockGenerateToken).not.toHaveBeenCalled();
      });
    });

    // ----------------------------------------------------------
    // TEST 6: Verify Token Rotation Security
    // ----------------------------------------------------------
    describe('Security - Token Rotation', () => {
      it('should revoke old token before creating new one', async () => {
        // ========== ARRANGE ==========
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        const testUser = createTestUser();
        mockFindUserById.mockResolvedValue(testUser);

        mockRevoke.mockResolvedValue(undefined);
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========
        /**
         * Token rotation is a security best practice:
         * 1. Old token must be revoked to prevent reuse
         * 2. New token must be created and returned
         *
         * This prevents token replay attacks
         */
        expect(mockRevoke).toHaveBeenCalledWith(testOldRefreshTokenValue);
        expect(mockCreateRefreshToken).toHaveBeenCalled();

        // Verify the order: revoke is called before create
        const revokeCallOrder = mockRevoke.mock.invocationCallOrder[0];
        const createCallOrder =
          mockCreateRefreshToken.mock.invocationCallOrder[0];
        expect(revokeCallOrder).toBeLessThan(createCallOrder);
      });
    });

    // ----------------------------------------------------------
    // TEST 7: Verify Output Structure
    // ----------------------------------------------------------
    describe('Output Structure Validation', () => {
      it('should return output with correct structure and types', async () => {
        // ========== ARRANGE ==========
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        const testUser = createTestUser();
        mockFindUserById.mockResolvedValue(testUser);

        mockRevoke.mockResolvedValue(undefined);
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        const result = await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========
        /**
         * Verify the output has all required properties
         * toHaveProperty() checks that a property exists
         */
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('expiresAt');
        expect(result).toHaveProperty('refreshToken');
        expect(result).toHaveProperty('refreshTokenExpiresAt');
        expect(result).toHaveProperty('user');

        // Verify user object structure
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('email');
        expect(result.user).toHaveProperty('role');
        expect(result.user).toHaveProperty('firstName');
        expect(result.user).toHaveProperty('lastName');

        // Verify types
        expect(typeof result.token).toBe('string');
        expect(typeof result.expiresAt).toBe('number');
        expect(typeof result.refreshToken).toBe('string');
        expect(typeof result.refreshTokenExpiresAt).toBe('number');
        expect(typeof result.user.id).toBe('string');
        expect(typeof result.user.email).toBe('string');
        expect(typeof result.user.role).toBe('string');
        expect(typeof result.user.firstName).toBe('string');
        expect(typeof result.user.lastName).toBe('string');
      });
    });

    // ----------------------------------------------------------
    // TEST 8: Verify ID Generator Usage
    // ----------------------------------------------------------
    describe('ID Generation', () => {
      it('should use idGenerator to create refresh token id and value', async () => {
        // ========== ARRANGE ==========
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        const testUser = createTestUser();
        mockFindUserById.mockResolvedValue(testUser);

        mockRevoke.mockResolvedValue(undefined);
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========
        /**
         * Verify idGenerator.generate() was called 2 times:
         * 1. First call: generates the refresh token ID
         * 2. Second call: generates the refresh token value
         *
         * This separation allows for different formats if needed
         * (e.g., UUID for ID, longer random string for token value)
         */
        expect(mockIdGenerate).toHaveBeenCalledTimes(2);
      });
    });

    // ----------------------------------------------------------
    // TEST 9: Different User Roles
    // ----------------------------------------------------------
    describe('Different User Roles', () => {
      it('should work correctly for PROFESSIONAL role', async () => {
        // ========== ARRANGE ==========
        const validRefreshToken = createValidRefreshToken();
        mockFindByToken.mockResolvedValue(validRefreshToken);

        // Create a professional user
        const professionalUser = new User(
          testUserId,
          testEmail,
          testPasswordHash,
          Role.PROFESSIONAL,
          testFirstName,
          testLastName,
        );
        mockFindUserById.mockResolvedValue(professionalUser);

        mockRevoke.mockResolvedValue(undefined);
        mockGenerateToken.mockResolvedValue(testNewJwtToken);
        mockGetExpirationTimestamp.mockReturnValue(testExpirationTimestamp);

        let idCallCount = 0;
        mockIdGenerate.mockImplementation(() => {
          idCallCount++;
          return idCallCount === 1
            ? testNewRefreshTokenId
            : testNewRefreshTokenValue;
        });

        mockCreateRefreshToken.mockResolvedValue(createNewRefreshTokenEntity());

        const input: RefreshTokenInput = {
          refreshToken: testOldRefreshTokenValue,
        };

        // ========== ACT ==========
        const result = await refreshTokenUseCase.execute(input);

        // ========== ASSERT ==========
        expect(result.user.role).toBe(Role.PROFESSIONAL);
        expect(mockGenerateToken).toHaveBeenCalledWith(
          testUserId,
          Role.PROFESSIONAL,
        );
      });
    });
  });
});
