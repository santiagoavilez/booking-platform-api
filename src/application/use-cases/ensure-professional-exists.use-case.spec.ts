/**
 * UNIT TESTS FOR EnsureProfessionalExistsUseCase
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
 * - Output validation (user exists and is a professional)
 * - Error cases (user not found, user is not a professional)
 */

import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

describe('EnsureProfessionalExistsUseCase unit tests', () => {
  let useCase: EnsureProfessionalExistsUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockFindById: jest.MockedFunction<IUserRepository['findById']>;
  const testProfessionalId = 'professional-123';
  const testProfessional: User = new User(
    testProfessionalId,
    'professional@example.com',
    'hashed_password_123',
    Role.PROFESSIONAL,
    'John',
    'Doe',
  );

  const testClientId = 'client-123';
  const testClient: User = new User(
    testClientId,
    'client@example.com',
    'hashed_password_123',
    Role.CLIENT,
    'Jane',
    'Smith',
  );

  beforeEach(() => {
    mockFindById = jest.fn();
    mockUserRepository = {
      findById: mockFindById,
      findByEmail: jest.fn(),
      create: jest.fn(),
      findProfessionalsPaginated: jest.fn(),
    };
    useCase = new EnsureProfessionalExistsUseCase(mockUserRepository);
  });

  // ============================================================
  // TESTS
  // ============================================================
  // happy path
  describe('execute', () => {
    it('should return the user if they exist and are a professional', async () => {
      mockFindById.mockResolvedValue(testProfessional);
      const result = await useCase.execute(testProfessionalId);
      expect(result).toEqual(testProfessional);
      expect(mockFindById).toHaveBeenCalledTimes(1);
      expect(mockFindById).toHaveBeenCalledWith(testProfessionalId);
    });

    // error case - user not found
    it('should throw an error if the user does not exist', async () => {
      mockFindById.mockResolvedValue(null);
      await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
        'User not found',
      );
      expect(mockFindById).toHaveBeenCalledTimes(1);
      expect(mockFindById).toHaveBeenCalledWith('nonexistent-id');
    });

    // error case - user is not a professional
    it('should throw an error if the user is not a professional', async () => {
      mockFindById.mockResolvedValue(testClient);
      await expect(useCase.execute(testClientId)).rejects.toThrow(
        'User is not a professional',
      );
      expect(mockFindById).toHaveBeenCalledTimes(1);
      expect(mockFindById).toHaveBeenCalledWith(testClientId);
    });
  });
});
