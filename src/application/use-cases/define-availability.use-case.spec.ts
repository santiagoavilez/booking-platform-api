// src/application/use-cases/define-availability.use-case.spec.ts

/**
 * UNIT TESTS FOR DefineAvailabilityUseCase
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
 *
 * FOCUS:
 * - Output validation (createdSlots count)
 * - Error cases (user not found, not a professional)
 * - Repository interactions (delete, createMany)
 * - Domain validation (overlaps) is tested indirectly
 */

import {
  DefineAvailabilityUseCase,
  DefineAvailabilityInput,
  DefineAvailabilityOutput,
} from './define-availability.use-case';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { IIdGenerator } from '../../domain/services/id-generator.interface';
import { User } from '../../domain/entities/user.entity';
import { Availability } from '../../domain/entities/availability.entity';
import { Role } from '../../domain/enums/role.enum';

/**
 * EXPLANATION OF MOCKS:
 *
 * A MOCK is a "fake" object that simulates the behavior of a real dependency.
 *
 * For DefineAvailabilityUseCase, we mock:
 * - IAvailabilityRepository: to simulate database operations (delete, createMany)
 * - EnsureProfessionalExistsUseCase: to simulate "user exists and is professional" validation
 * - IIdGenerator: to simulate ID generation for availability slots
 *
 * jest.fn() creates a "spy function" that:
 * 1. Records how many times it was called
 * 2. Records with what arguments it was called
 * 3. Allows defining what value it should return (with mockResolvedValue or mockReturnValue)
 */
describe('DefineAvailabilityUseCase', () => {
  // ============================================================
  // GLOBAL ARRANGE - Variables we'll use in all tests
  // ============================================================

  /**
   * The use case we're testing
   */
  let defineAvailabilityUseCase: DefineAvailabilityUseCase;

  /**
   * Mocks of use case dependencies
   *
   * jest.Mocked<T> is a type indicating it's a mocked version of T
   * This gives us autocomplete and type safety
   */
  let mockAvailabilityRepository: jest.Mocked<IAvailabilityRepository>;
  let mockEnsureProfessionalExistsUseCase: jest.Mocked<EnsureProfessionalExistsUseCase>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;

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
  let mockEnsureExecute: jest.MockedFunction<
    EnsureProfessionalExistsUseCase['execute']
  >;
  let mockDeleteByProfessionalId: jest.MockedFunction<
    IAvailabilityRepository['deleteByProfessionalId']
  >;
  let mockCreateMany: jest.MockedFunction<
    IAvailabilityRepository['createMany']
  >;
  let mockGenerate: jest.MockedFunction<IIdGenerator['generate']>;

  /**
   * Test data we'll reuse
   */
  const testProfessionalId = 'professional-123';
  const testEmail = 'professional@example.com';
  const testPasswordHash = 'hashed_password_123';
  const testFirstName = 'John';
  const testLastName = 'Doe';

  /**
   * Helper function to create a test professional user
   */
  const createTestProfessional = (): User => {
    return new User(
      testProfessionalId,
      testEmail,
      testPasswordHash,
      Role.PROFESSIONAL,
      testFirstName,
      testLastName,
    );
  };

  /**
   * Helper function to create a test client user (non-professional)
   */
  const createTestClient = (): User => {
    return new User(
      'client-123',
      'client@example.com',
      testPasswordHash,
      Role.CLIENT,
      'Jane',
      'Smith',
    );
  };

  /**
   * Helper function to create valid availability slots input
   */
  const createValidSlotsInput = () => [
    {
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '12:00',
    },
    {
      dayOfWeek: 1, // Monday
      startTime: '14:00',
      endTime: '18:00',
    },
    {
      dayOfWeek: 3, // Wednesday
      startTime: '10:00',
      endTime: '16:00',
    },
  ];

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
    mockEnsureExecute = jest.fn();
    mockDeleteByProfessionalId = jest.fn().mockResolvedValue(undefined);
    mockCreateMany = jest.fn();
    mockGenerate = jest.fn();

    // Mock of EnsureProfessionalExistsUseCase
    mockEnsureProfessionalExistsUseCase = {
      execute: mockEnsureExecute,
    } as unknown as jest.Mocked<EnsureProfessionalExistsUseCase>;

    // Mock of AvailabilityRepository
    mockAvailabilityRepository = {
      create: jest.fn(),
      createMany: mockCreateMany,
      findByProfessionalId: jest.fn(),
      findByProfessionalIdAndDay: jest.fn(),
      deleteByProfessionalId: mockDeleteByProfessionalId,
      findByProfessionalIdAndTimeRange: jest.fn(),
    };

    // Mock of IdGenerator - generates sequential IDs for tests
    let idCounter = 0;
    mockGenerate.mockImplementation(() => {
      idCounter++;
      return `availability-id-${idCounter}`;
    });
    mockIdGenerator = {
      generate: mockGenerate,
    };

    /**
     * Create the use case with mocked dependencies
     *
     * Normally NestJS does this automatically with DI (Dependency Injection)
     * In tests, we do it manually by passing the mocks
     */
    defineAvailabilityUseCase = new DefineAvailabilityUseCase(
      mockAvailabilityRepository,
      mockEnsureProfessionalExistsUseCase,
      mockIdGenerator,
    );
  });

  // ============================================================
  // TESTS
  // ============================================================

  /**
   * describe() groups related tests
   * We use nested describe blocks to better organize tests
   */
  describe('execute', () => {
    // ----------------------------------------------------------
    // TEST 1: Happy Path - Define availability successfully
    // ----------------------------------------------------------
    /**
     * it() defines an individual test
     * The string describes WHAT should happen if the code works correctly
     */
    it('should create availability slots successfully and return correct count', async () => {
      // ========== ARRANGE ==========
      // Prepare the scenario: professional exists and slots are valid

      const testProfessional = createTestProfessional();
      const slotsInput = createValidSlotsInput();
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: slotsInput,
      };

      /**
       * Configure what each mock should return when called
       *
       * mockResolvedValue: For async functions that return Promises
       * The value we pass is what will be returned when the method is called
       */
      mockEnsureExecute.mockResolvedValue(testProfessional);

      // Mock createMany to return the created availabilities
      const mockCreatedAvailabilities = slotsInput.map((slot, index) => {
        return new Availability(
          `availability-id-${index + 1}`,
          testProfessionalId,
          slot.dayOfWeek,
          slot.startTime,
          slot.endTime,
        );
      });
      mockCreateMany.mockResolvedValue(mockCreatedAvailabilities);

      // ========== ACT ==========
      // Execute the method we want to test
      const result: DefineAvailabilityOutput =
        await defineAvailabilityUseCase.execute(input);

      // ========== ASSERT ==========
      // Verify the result is as expected

      /**
       * expect() creates an "expectation"
       * .toBe() verifies strict equality (===)
       * .toEqual() verifies deep equality (for objects)
       */

      // Verify output structure and count
      expect(result).toBeDefined();
      expect(result.createdSlots).toBe(3);
      expect(typeof result.createdSlots).toBe('number');

      /**
       * toHaveBeenCalled() verifies that the mock was called
       * toHaveBeenCalledWith() verifies that it was called with specific arguments
       *
       * This is important to verify that the use case interacts
       * correctly with its dependencies
       */

      // Verify professional validation (EnsureProfessionalExistsUseCase)
      expect(mockEnsureExecute).toHaveBeenCalledTimes(1);
      expect(mockEnsureExecute).toHaveBeenCalledWith(testProfessionalId);

      // Verify existing availability was deleted (replaced completely)
      expect(mockDeleteByProfessionalId).toHaveBeenCalledTimes(1);
      expect(mockDeleteByProfessionalId).toHaveBeenCalledWith(
        testProfessionalId,
      );

      // Verify ID generator was called for each slot
      expect(mockGenerate).toHaveBeenCalledTimes(3);

      // Verify createMany was called with correct availabilities
      expect(mockCreateMany).toHaveBeenCalledTimes(1);
      const createManyCallArg = mockCreateMany.mock.calls[0][0];
      expect(createManyCallArg).toHaveLength(3);
      expect(createManyCallArg[0].professionalId).toBe(testProfessionalId);
      expect(createManyCallArg[0].dayOfWeek).toBe(1);
      expect(createManyCallArg[0].startTime).toBe('09:00');
      expect(createManyCallArg[0].endTime).toBe('12:00');
    });

    // ----------------------------------------------------------
    // TEST 2: Error - User not found
    // ----------------------------------------------------------
    it('should throw error when user is not found', async () => {
      // ========== ARRANGE ==========
      const slotsInput = createValidSlotsInput();
      const input: DefineAvailabilityInput = {
        professionalId: 'nonexistent-id',
        slots: slotsInput,
      };

      /**
       * Configure the mock to throw (user not found)
       * EnsureProfessionalExistsUseCase throws when user doesn't exist
       */
      mockEnsureExecute.mockRejectedValue(new Error('User not found'));

      // ========== ACT & ASSERT ==========
      /**
       * To test that a function throws an error, we use:
       * expect(async () => ...).rejects.toThrow('message')
       *
       * rejects: indicates we expect the Promise to be rejected
       * toThrow: verifies that an Error is thrown with the specified message
       */
      await expect(defineAvailabilityUseCase.execute(input)).rejects.toThrow(
        'User not found',
      );

      // Verify that deleteByProfessionalId was NOT called
      // (because the flow stopped before that)
      expect(mockDeleteByProfessionalId).not.toHaveBeenCalled();

      // Verify that createMany was NOT called
      expect(mockCreateMany).not.toHaveBeenCalled();

      // Verify that ID generator was NOT called
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 3: Error - User is not a professional
    // ----------------------------------------------------------
    it('should throw error when user is not a professional', async () => {
      // ========== ARRANGE ==========
      const testClient = createTestClient();
      const slotsInput = createValidSlotsInput();
      const input: DefineAvailabilityInput = {
        professionalId: testClient.id,
        slots: slotsInput,
      };

      // EnsureProfessionalExistsUseCase throws when user is not a professional
      mockEnsureExecute.mockRejectedValue(
        new Error('User is not a professional'),
      );

      // ========== ACT & ASSERT ==========
      await expect(defineAvailabilityUseCase.execute(input)).rejects.toThrow(
        'User is not a professional',
      );

      // Verify that deleteByProfessionalId was NOT called
      // (because the flow stopped before that)
      expect(mockDeleteByProfessionalId).not.toHaveBeenCalled();

      // Verify that createMany was NOT called
      expect(mockCreateMany).not.toHaveBeenCalled();

      // Verify that ID generator was NOT called
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 4: Verify that existing availability is deleted before creating new ones
    // ----------------------------------------------------------
    it('should delete existing availability before creating new slots', async () => {
      // ========== ARRANGE ==========
      const testProfessional = createTestProfessional();
      const slotsInput = createValidSlotsInput();
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: slotsInput,
      };

      mockEnsureExecute.mockResolvedValue(testProfessional);
      mockCreateMany.mockResolvedValue([]);

      // ========== ACT ==========
      await defineAvailabilityUseCase.execute(input);

      // ========== ASSERT ==========
      /**
       * Verify that deleteByProfessionalId was called BEFORE createMany
       *
       * We check the call order by comparing the invocation call order
       * deleteByProfessionalId should be called before createMany
       */
      const deleteCallOrder =
        mockDeleteByProfessionalId.mock.invocationCallOrder[0];
      const createManyCallOrder = mockCreateMany.mock.invocationCallOrder[0];

      expect(deleteCallOrder).toBeLessThan(createManyCallOrder);

      // Verify both were called
      expect(mockDeleteByProfessionalId).toHaveBeenCalledTimes(1);
      expect(mockCreateMany).toHaveBeenCalledTimes(1);
    });

    // ----------------------------------------------------------
    // TEST 5: Verify output structure with empty slots array
    // ----------------------------------------------------------
    it('should return createdSlots: 0 when slots array is empty', async () => {
      // ========== ARRANGE ==========
      const testProfessional = createTestProfessional();
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: [], // Empty array
      };

      mockEnsureExecute.mockResolvedValue(testProfessional);
      mockCreateMany.mockResolvedValue([]);

      // ========== ACT ==========
      const result = await defineAvailabilityUseCase.execute(input);

      // ========== ASSERT ==========
      expect(result.createdSlots).toBe(0);
      expect(mockCreateMany).toHaveBeenCalledWith([]);
      expect(mockGenerate).not.toHaveBeenCalled(); // No IDs generated for empty array
    });

    // ----------------------------------------------------------
    // TEST 6: Verify that domain validation (overlaps) is triggered
    // ----------------------------------------------------------
    /**
     * NOTE: This test verifies that the use case calls Availability.validateNoOverlaps()
     * The actual overlap validation logic is tested in the domain entity tests.
     * Here we verify that the use case properly delegates to the domain.
     */
    it('should throw error when slots have overlaps (domain validation)', async () => {
      // ========== ARRANGE ==========
      const testProfessional = createTestProfessional();
      const overlappingSlots = [
        {
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '12:00',
        },
        {
          dayOfWeek: 1, // Monday - OVERLAPS with previous
          startTime: '11:00', // Starts before previous ends
          endTime: '14:00',
        },
      ];
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: overlappingSlots,
      };

      mockEnsureExecute.mockResolvedValue(testProfessional);

      // ========== ACT & ASSERT ==========
      /**
       * The Availability entity's validateNoOverlaps() will throw an error
       * We verify that this error is propagated correctly
       */
      await expect(defineAvailabilityUseCase.execute(input)).rejects.toThrow(
        'Overlapping availability slots',
      );

      // Verify that deleteByProfessionalId was called (cleanup happened)
      expect(mockDeleteByProfessionalId).toHaveBeenCalledTimes(1);

      // Verify that createMany was NOT called (validation failed before persistence)
      expect(mockCreateMany).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    // TEST 7: Verify output structure with single slot
    // ----------------------------------------------------------
    it('should return createdSlots: 1 when only one slot is provided', async () => {
      // ========== ARRANGE ==========
      const testProfessional = createTestProfessional();
      const singleSlot = [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      ];
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: singleSlot,
      };

      mockEnsureExecute.mockResolvedValue(testProfessional);
      const mockCreatedAvailability = new Availability(
        'availability-id-1',
        testProfessionalId,
        1,
        '09:00',
        '17:00',
      );
      mockCreateMany.mockResolvedValue([mockCreatedAvailability]);

      // ========== ACT ==========
      const result = await defineAvailabilityUseCase.execute(input);

      // ========== ASSERT ==========
      expect(result.createdSlots).toBe(1);
      expect(mockGenerate).toHaveBeenCalledTimes(1);
      expect(mockCreateMany).toHaveBeenCalledTimes(1);
      expect(mockCreateMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            professionalId: testProfessionalId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
          }),
        ]),
      );
    });

    // ----------------------------------------------------------
    // TEST 8: Verify that all slots are created with correct professional ID
    // ----------------------------------------------------------
    it('should create all slots with the correct professional ID', async () => {
      // ========== ARRANGE ==========
      const testProfessional = createTestProfessional();
      const slotsInput = createValidSlotsInput();
      const input: DefineAvailabilityInput = {
        professionalId: testProfessionalId,
        slots: slotsInput,
      };

      mockEnsureExecute.mockResolvedValue(testProfessional);
      mockCreateMany.mockResolvedValue([]);

      // ========== ACT ==========
      await defineAvailabilityUseCase.execute(input);

      // ========== ASSERT ==========
      const createManyCallArg = mockCreateMany.mock.calls[0][0];
      expect(createManyCallArg).toHaveLength(3);

      // Verify all slots have the correct professional ID
      createManyCallArg.forEach((availability) => {
        expect(availability.professionalId).toBe(testProfessionalId);
      });
    });
  });
});
