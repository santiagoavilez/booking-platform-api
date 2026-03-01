// src/application/use-cases/search-professionals.use-case.spec.ts

import { SearchProfessionalsUseCase } from './search-professionals.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

describe('SearchProfessionalsUseCase', () => {
  let useCase: SearchProfessionalsUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockFindProfessionalsPaginated: jest.MockedFunction<
    IUserRepository['findProfessionalsPaginated']
  >;

  const createProfessional = (
    id: string,
    firstName: string,
    lastName: string,
  ): User =>
    new User(id, `${id}@x.com`, 'hash', Role.PROFESSIONAL, firstName, lastName);

  beforeEach(() => {
    mockFindProfessionalsPaginated = jest.fn();

    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findProfessionalsPaginated: mockFindProfessionalsPaginated,
    };

    useCase = new SearchProfessionalsUseCase(mockUserRepository);
  });

  it('should return paginated professionals with normalized page and limit', async () => {
    const users = [
      createProfessional('prof-1', 'John', 'Doe'),
      createProfessional('prof-2', 'Jane', 'Smith'),
    ];

    mockFindProfessionalsPaginated.mockResolvedValue({
      items: users,
      total: 2,
    });

    const result = await useCase.execute(undefined, 1, 10);

    expect(result).toEqual({
      items: [
        {
          id: 'prof-1',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
        },
        {
          id: 'prof-2',
          firstName: 'Jane',
          lastName: 'Smith',
          fullName: 'Jane Smith',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith(
      undefined,
      1,
      10,
    );
  });

  it('should normalize page to at least 1', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await useCase.execute(undefined, 0, 10);

    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith(
      undefined,
      1,
      10,
    );
  });

  it('should clamp limit to max 50', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await useCase.execute(undefined, 1, 100);

    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith(
      undefined,
      1,
      50,
    );
  });

  it('should clamp limit to min 1', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await useCase.execute(undefined, 1, 0);

    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith(
      undefined,
      1,
      1,
    );
  });

  it('should trim and pass search string when provided', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await useCase.execute('  john  ', 1, 10);

    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith('john', 1, 10);
  });

  it('should pass undefined for empty or whitespace-only search', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await useCase.execute('   ', 1, 10);

    expect(mockFindProfessionalsPaginated).toHaveBeenCalledWith(
      undefined,
      1,
      10,
    );
  });

  it('should calculate totalPages correctly', async () => {
    mockFindProfessionalsPaginated.mockResolvedValue({
      items: [createProfessional('prof-1', 'John', 'Doe')],
      total: 25,
    });

    const result = await useCase.execute(undefined, 1, 10);

    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});
