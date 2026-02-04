/**
 * UNIT TESTS FOR GetProfessionalAvailabilityUseCase
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
 * - Output validation (availability slots count)
 * - Error cases (professional not found)
 */

import {
  GetProfessionalAvailabilityInput,
  GetProfessionalAvailabilityOutput,
  GetProfessionalAvailabilityUseCase,
} from './get-professional-availability.use-case';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { Role } from '../../domain/enums/role.enum';
import { User } from '../../domain/entities/user.entity';
import { Availability } from '../../domain/entities/availability.entity';

describe('GetProfessionalAvailabilityUseCase', () => {
  let useCase: GetProfessionalAvailabilityUseCase;

  // Mocks of use case dependencies
  let mockAvailabilityRepository: jest.Mocked<IAvailabilityRepository>;
  let mockEnsureProfessionalExistsUseCase: jest.Mocked<EnsureProfessionalExistsUseCase>;

  // Individual mock functions for assertions
  let mockEnsureExecute: jest.MockedFunction<
    EnsureProfessionalExistsUseCase['execute']
  >;
  let mockFindByProfessionalId: jest.MockedFunction<
    IAvailabilityRepository['findByProfessionalId']
  >;

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

  const testClientId = 'client-123';

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
    mockEnsureExecute = jest.fn();
    mockFindByProfessionalId = jest.fn();
    mockEnsureProfessionalExistsUseCase = {
      execute: mockEnsureExecute,
    } as unknown as jest.Mocked<EnsureProfessionalExistsUseCase>;

    mockAvailabilityRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findByProfessionalId: mockFindByProfessionalId,
      findByProfessionalIdAndDay: jest.fn(),
      deleteByProfessionalId: jest.fn(),
      findByProfessionalIdAndTimeRange: jest.fn(),
    };

    /**
     * create the use case with mocked dependencies
     *
     * Normally NestJS does this automatically with DI (Dependency Injection)
     * In tests, we do it manually by passing the mocks
     */
    useCase = new GetProfessionalAvailabilityUseCase(
      mockAvailabilityRepository,
      mockEnsureProfessionalExistsUseCase,
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
    // TEST 1: Happy Path - Get availability successfully
    // ----------------------------------------------------------
    it('should get availability slots successfully and return correct count', async () => {
      // ========== ARRANGE ==========
      // Prepare the scenario: professional exists and has availability slots
      const professional = createTestProfessional();
      mockEnsureExecute.mockResolvedValue(professional);
      mockFindByProfessionalId.mockResolvedValue([
        new Availability(
          'availability-1',
          testProfessionalId,
          1,
          '09:00',
          '17:00',
        ),
      ]);
      const input: GetProfessionalAvailabilityInput = {
        professionalId: testProfessionalId,
      };
      const result: GetProfessionalAvailabilityOutput =
        await useCase.execute(input);

      /**
       * Verify calls to dependencies in the happy path
       * EnsureProfessionalExistsUseCase.execute called with professionalId.
       * mockFindByProfessionalId called 1 time with testProfessionalId.
       */
      expect(mockEnsureExecute).toHaveBeenCalledTimes(1);
      expect(mockEnsureExecute).toHaveBeenCalledWith(testProfessionalId);
      expect(mockFindByProfessionalId).toHaveBeenCalledTimes(1);
      expect(mockFindByProfessionalId).toHaveBeenCalledWith(testProfessionalId);
      expect(result).toBeDefined();
      expect(result.availabilities).toBeDefined();
      expect(result.availabilities.length).toBe(1);
      expect(result.professional).toEqual({
        firstName: professional.firstName,
        lastName: professional.lastName,
      });
      expect(result.availabilities[0].id).toBe('availability-1');
      expect(result.availabilities[0].professionalId).toBe(testProfessionalId);
      expect(result.availabilities[0].dayOfWeek).toBe(1);
      expect(result.availabilities[0].startTime).toBe('09:00');
      expect(result.availabilities[0].endTime).toBe('17:00');
    });

    // ----------------------------------------------------------
    // TEST 2: Error case - Professional not found
    // ----------------------------------------------------------
    it('should throw an error if professional is not found', async () => {
      // ========== ARRANGE ==========
      const input: GetProfessionalAvailabilityInput = {
        professionalId: 'nonexistent-professional-id',
      };
      mockEnsureExecute.mockRejectedValue(new Error('User not found'));
      await expect(useCase.execute(input)).rejects.toThrow('User not found');
      expect(mockEnsureExecute).toHaveBeenCalledTimes(1);
      expect(mockEnsureExecute).toHaveBeenCalledWith(
        'nonexistent-professional-id',
      );
    });

    // ----------------------------------------------------------
    // TEST 3: Error case - Professional is not a professional
    // ----------------------------------------------------------
    it('should throw an error if professional is not a professional', async () => {
      // ========== ARRANGE ==========
      const input: GetProfessionalAvailabilityInput = {
        professionalId: testClientId,
      };
      mockEnsureExecute.mockRejectedValue(
        new Error('User is not a professional'),
      );
      await expect(useCase.execute(input)).rejects.toThrow(
        'User is not a professional',
      );
      expect(mockEnsureExecute).toHaveBeenCalledTimes(1);
      expect(mockEnsureExecute).toHaveBeenCalledWith(testClientId);
    });

    // ----------------------------------------------------------
    // TEST 4: Error case - Professional has no availability slots
    // ----------------------------------------------------------
    it('should return empty array when professional has no availability slots', async () => {
      // ========== ARRANGE ==========
      const professional = createTestProfessional();
      mockEnsureExecute.mockResolvedValue(professional);
      mockFindByProfessionalId.mockResolvedValue([]);
      const input: GetProfessionalAvailabilityInput = {
        professionalId: testProfessionalId,
      };

      const result: GetProfessionalAvailabilityOutput =
        await useCase.execute(input);
      // {"availabilities": [], "professional": {"firstName": "John", "lastName": "Doe"}}
      expect(result).toEqual({
        availabilities: [],
        professional: {
          firstName: result.professional.firstName,
          lastName: result.professional.lastName,
        },
      });
      expect(result.availabilities).toEqual([]);
      expect(result.professional).toEqual({
        firstName: professional.firstName,
        lastName: professional.lastName,
      });
      expect(result.availabilities.length).toBe(0);
      expect(mockEnsureExecute).toHaveBeenCalledTimes(1);
      expect(mockEnsureExecute).toHaveBeenCalledWith(testProfessionalId);
      expect(mockFindByProfessionalId).toHaveBeenCalledTimes(1);
      expect(mockFindByProfessionalId).toHaveBeenCalledWith(testProfessionalId);
    });

    // ----------------------------------------------------------
    // TEST 5: Return all availability slots when professional has multiple slots
    // ----------------------------------------------------------
    it('should return all availability slots when professional has multiple slots', async () => {
      // ARRANGE
      const professional = createTestProfessional();
      mockEnsureExecute.mockResolvedValue(professional);
      const multipleSlots = [
        new Availability('av-1', testProfessionalId, 1, '09:00', '17:00'),
        new Availability('av-2', testProfessionalId, 2, '10:00', '18:00'),
        new Availability('av-3', testProfessionalId, 3, '08:00', '16:00'),
      ];
      mockFindByProfessionalId.mockResolvedValue(multipleSlots);

      const input: GetProfessionalAvailabilityInput = {
        professionalId: testProfessionalId,
      };

      // ACT
      const result = await useCase.execute(input);

      // ASSERT
      expect(result.availabilities).toHaveLength(3);
      expect(result.availabilities[0].dayOfWeek).toBe(1);
      expect(result.availabilities[1].dayOfWeek).toBe(2);
      expect(result.availabilities[2].dayOfWeek).toBe(3);
      expect(result.professional.firstName).toBe(testFirstName);
      expect(result.professional.lastName).toBe(testLastName);
    });
  });
});
