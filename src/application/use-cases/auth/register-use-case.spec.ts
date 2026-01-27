// src/application/use-cases/auth/register-use-case.spec.ts

/**
 * UNIT TESTS FOR RegisterUserUseCase
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
  RegisterUserUseCase,
  RegisterUserInput,
  RegisterUserOutput,
} from './register-user.use-case';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { IIdGenerator } from '../../../domain/services/id-generator.interface';
import { LoginUseCase, LoginOutput } from './login.use-case';
import { Role } from '../../../domain/enums/role.enum';
import { User } from '../../../domain/entities/user.entity';

/**
 * EXPLANATION OF MOCKS:
 *
 * A MOCK is a "fake" object that simulates the behavior of a real dependency.
 *
 * For RegisterUserUseCase, we mock:
 * - IUserRepository: to simulate database operations
 * - IPasswordHasher: to simulate password hashing
 * - IIdGenerator: to simulate ID generation
 * - LoginUseCase: to simulate auto-login after registration
 *
 * jest.fn() creates a "spy function" that:
 * 1. Records how many times it was called
 * 2. Records with what arguments it was called
 * 3. Allows defining what value it should return (with mockResolvedValue or mockReturnValue)
 */
describe('RegisterUserUseCase', () => {
  // ============================================================
  // GLOBAL ARRANGE - Variables we'll use in all tests
  // ============================================================

  /**
   * The use case we're testing
   */
  let registerUserUseCase: RegisterUserUseCase;

  /**
   * Mocks of use case dependencies
   *
   * jest.Mocked<T> is a type indicating it's a mocked version of T
   * This gives us autocomplete and type safety
   */
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockLoginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>>;

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
  let mockFindByEmail: jest.MockedFunction<IUserRepository['findByEmail']>;
  let mockCreate: jest.MockedFunction<IUserRepository['create']>;
  let mockHash: jest.MockedFunction<IPasswordHasher['hash']>;
  let mockGenerate: jest.MockedFunction<IIdGenerator['generate']>;
  let mockLoginExecute: jest.MockedFunction<LoginUseCase['execute']>;

  /**
   * Test data we'll reuse
   */
  const testUserId = 'user-123';
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  const testPasswordHash = 'hashed_password_123';
  const testFirstName = 'John';
  const testLastName = 'Doe';
  const testRole = Role.PROFESSIONAL;
  const testJwtToken = 'jwt.token.here';
  const testRefreshToken = 'refresh-token-123';

  /**
   * Helper function to create test user
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
   * Helper function to create expected login output
   */
  const createLoginOutput = (): LoginOutput => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return {
      token: testJwtToken,
      expiresAt: nowInSeconds + 3600, // 1 hour from now
      refreshToken: testRefreshToken,
      refreshTokenExpiresAt: nowInSeconds + 604800, // 7 days from now
      user: {
        id: testUserId,
        email: testEmail,
        role: testRole,
        firstName: testFirstName,
        lastName: testLastName,
      },
    };
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
     * Create mocks for each dependency
     *
     * For each interface method, we use jest.fn() which creates a spy function
     * mockResolvedValue() defines what value the Promise returns when resolved
     * mockReturnValue() defines what value it returns (for synchronous functions)
     */

    // Create individual mock functions first
    mockFindByEmail = jest.fn();
    mockCreate = jest.fn();
    mockHash = jest.fn();
    mockGenerate = jest.fn();
    mockLoginExecute = jest.fn();

    // Mock of UserRepository
    mockUserRepository = {
      findByEmail: mockFindByEmail,
      findById: jest.fn(),
      create: mockCreate,
    };

    // Mock of PasswordHasher
    mockPasswordHasher = {
      hash: mockHash,
      compare: jest.fn(),
    };

    // Mock of IdGenerator
    mockIdGenerator = {
      generate: mockGenerate,
    };

    /**
     * Mock of LoginUseCase
     *
     * ARCHITECTURAL DECISION:
     * - What: We only mock the 'execute' method, not the entire LoginUseCase
     * - Why: RegisterUserUseCase only uses loginUseCase.execute(), so we don't need
     *        to mock internal properties (userRepository, passwordHasher, etc.)
     * - Pattern: Mock only what you use - keeps tests simple and focused
     */
    mockLoginUseCase = {
      execute: mockLoginExecute,
    } as jest.Mocked<Pick<LoginUseCase, 'execute'>>;

    // Create the use case with mocked dependencies
    registerUserUseCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockIdGenerator,
      mockLoginUseCase as unknown as LoginUseCase,
    );
  });

  // ============================================================
  // HAPPY PATH TESTS
  // ============================================================
  describe('Happy Path - Successful Registration', () => {
    it('should register a new user and return login tokens', async () => {
      // ============================================================
      // ARRANGE - Configure mocks to simulate successful registration
      // ============================================================

      // 1. User does not exist (email is available)
      mockFindByEmail.mockResolvedValue(null);

      // 2. Password hasher returns hashed password
      mockHash.mockResolvedValue(testPasswordHash);

      // 3. ID generator returns a unique ID
      mockGenerate.mockReturnValue(testUserId);

      // 4. User repository successfully creates the user
      const createdUser = createTestUser();
      mockCreate.mockResolvedValue(createdUser);

      // 5. LoginUseCase returns tokens after auto-login
      const expectedLoginOutput = createLoginOutput();
      mockLoginExecute.mockResolvedValue(expectedLoginOutput);

      // Input data for registration
      const input: RegisterUserInput = {
        email: testEmail,
        password: testPassword,
        role: testRole,
        firstName: testFirstName,
        lastName: testLastName,
      };

      // ============================================================
      // ACT - Execute the use case
      // ============================================================
      const output: RegisterUserOutput =
        await registerUserUseCase.execute(input);

      // ============================================================
      // ASSERT - Verify the result
      // ============================================================

      // Verify output is defined and has correct structure
      expect(output).toBeDefined();
      expect(output.token).toBe(testJwtToken);
      expect(output.expiresAt).toBeDefined();
      expect(output.refreshToken).toBe(testRefreshToken);
      expect(output.refreshTokenExpiresAt).toBeDefined();
      expect(output.user).toBeDefined();
      expect(output.user.id).toBe(testUserId);
      expect(output.user.email).toBe(testEmail);
      expect(output.user.role).toBe(testRole);

      // Verify mocks were called with correct arguments
      expect(mockFindByEmail).toHaveBeenCalledTimes(1);
      expect(mockFindByEmail).toHaveBeenCalledWith(testEmail);

      expect(mockHash).toHaveBeenCalledTimes(1);
      expect(mockHash).toHaveBeenCalledWith(testPassword);

      expect(mockGenerate).toHaveBeenCalledTimes(1);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      // Verify user was created with correct data
      const createCallArg = mockCreate.mock.calls[0][0];
      expect(createCallArg.id).toBe(testUserId);
      expect(createCallArg.email).toBe(testEmail);
      expect(createCallArg.getPasswordHash()).toBe(testPasswordHash);
      expect(createCallArg.role).toBe(testRole);
      expect(createCallArg.firstName).toBe(testFirstName);
      expect(createCallArg.lastName).toBe(testLastName);

      expect(mockLoginExecute).toHaveBeenCalledTimes(1);
      expect(mockLoginExecute).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
      });
    });
  });

  // ============================================================
  // ERROR CASES - TODO: Implement these tests
  // ============================================================
  // describe('Error Cases', () => {
  //   it('should throw error if email already exists', async () => {
  //     // TODO: Implement
  //   });
  // });

  describe('Error Cases', () => {
    it('should throw error if email already exists', async () => {
      // 1. User exists (email is not available)
      mockFindByEmail.mockResolvedValue(createTestUser());

      // 2. Input data for registration
      const input: RegisterUserInput = {
        email: testEmail,
        password: testPassword,
        role: testRole,
        firstName: testFirstName,
        lastName: testLastName,
      };

      // ============================================================
      // ACT - Execute the use case
      // ============================================================
      await expect(registerUserUseCase.execute(input)).rejects.toThrow(
        'User with this email already exists',
      );
    });
    // hash error passwordHasher.hash lanza excepción

    it('should throw error if password hashing fails', () => {
      // 1. User exists (email is not available)
      mockFindByEmail.mockResolvedValue(createTestUser());

      // 2. Password hasher returns error
      mockHash.mockRejectedValue(new Error('Password hashing failed'));
    });

    // ❌ Error de BD: userRepository.create lanza excepción
    it('should throw error if database creation fails', () => {
      // 1. User exists (email is not available)
      mockFindByEmail.mockResolvedValue(createTestUser());

      // 2. User repository returns error
      mockCreate.mockRejectedValue(new Error('Database creation failed'));
    });
  });
});
