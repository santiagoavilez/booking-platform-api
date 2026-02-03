/* eslint-disable @typescript-eslint/unbound-method */
// src/application/use-cases/create-appointment.use-case.spec.ts

/**
 * ARCHITECTURAL DECISION:
 * - What: Test suite for CreateAppointmentUseCase
 * - Why: Ensures the use case is working as expected
 * - Responsibilities:
 *   - Test the use case with valid and invalid inputs
 *   - Test the use case with different scenarios
 *   - Test the use case with different edge cases
 *   - Test the use case with different error cases
 *   - Test the use case with different success cases
 *   - Test the use case with different boundary cases
 *   - Test the use case with different performance cases
 *   - Test the use case with different security cases
 *
 */

import { IAppointmentRepository } from 'src/domain/repositories/appointment.repository';
import {
  CreateAppointmentUseCase,
  CreateAppointmentInput,
  CreateAppointmentOutput,
} from './create-appointment.use-case';
import { EnsureProfessionalExistsUseCase } from './ensure-professional-exists.use-case';
import { IIdGenerator } from 'src/domain/services/id-generator.interface';
import { IUserRepository } from 'src/domain/repositories/user.repository';
import { IAvailabilityRepository } from 'src/domain/repositories/availability.repository';
import { Role } from '../../domain/enums/role.enum';
import { User } from '../../domain/entities/user.entity';
import { Appointment } from '../../domain/entities/appointment.entity';
import { type Availability } from '../../domain/entities/availability.entity';

/**
 * EXPLANATION OF MOCKS:
 *
 * A MOCK is a "fake" object that simulates the behavior of a real dependency.
 *
 * For CreateAppointmentUseCase, we mock:
 * - IAppointmentRepository: to simulate database operations (create)
 * - IAvailabilityRepository: to simulate database operations (findByProfessionalIdAndDay)
 * - IUserRepository: to simulate database operations (findById)
 * - IIdGenerator: to simulate ID generation for appointment
 * - EnsureProfessionalExistsUseCase: to simulate "user exists and is professional" validation
 *
 * jest.fn() creates a "spy function" that:
 * 1. Records how many times it was called
 * 2. Records with what arguments it was called
 * 3. Allows defining what value it should return (with mockResolvedValue or mockReturnValue)
 */
describe('CreateAppointmentUseCase', () => {
  // GLOBAL ARRANGE - Variables we'll use in all tests
  // ============================================================
  /**
   * The use case we're testing
   */
  let createAppointmentUseCase: CreateAppointmentUseCase;

  /**
   * Mocks of use case dependencies
   *
   * jest.Mocked<T> is a type indicating it's a mocked version of T
   * This gives us autocomplete and type safety
   */
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockAvailabilityRepository: jest.Mocked<IAvailabilityRepository>;

  /**
   * Mocks of use case dependencies
   *
   * jest.Mocked<T> is a type indicating it's a mocked version of T
   * This gives us autocomplete and type safety
   */

  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockEnsureProfessionalExistsUseCase: jest.Mocked<EnsureProfessionalExistsUseCase>;

  /**
   * Individual mock functions for assertions
   *
   * jest.fn() creates a "spy function" that:
   * 1. Records how many times it was called
   * 2. Records with what arguments it was called
   * 3. Allows defining what value it should return (with mockResolvedValue or mockReturnValue)
   */
  /**
   * Helper function to create a test professional user
   */
  const createTestProfessional = (): User => {
    return new User(
      'professional_id',
      'test@test.com',
      'testPasswordHash',
      Role.PROFESSIONAL,
      'testFirstName',
      'testLastName',
    );
  };

  const createTestProfessionalNotProfessional = (): User => {
    return new User(
      'professional_id_not_professional',
      'professional_not_professional@test.com',
      'professional_not_professionalPasswordHash',
      Role.CLIENT,
      'professional_not_professionalFirstName',
      'professional_not_professionalLastName',
    );
  };
  /**
   * Helper function to create a test client user
   */
  const createTestClient = (): User => {
    return new User(
      'client_id',
      'client@test.com',
      'clientPasswordHash',
      Role.CLIENT,
      'clientFirstName',
      'clientLastName',
    );
  };
  const availableSlots = [
    {
      id: 'availability_id',
      professionalId: createTestProfessional().id,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '20:00',
    },
    {
      id: 'availability_id_2',
      professionalId: createTestProfessional().id,
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '20:00',
    },
  ];

  /**
   * Returns the next Monday at 10:00 UTC (and 11:00 for end).
   * Always in the future so tests remain idempotent regardless of run date.
   **/
  function getNextMondayAt10UTC(): { startsAt: Date; endsAt: Date } {
    const now = new Date();
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat. (8 - getDay()) % 7 = days until next Mon; 0 when today is Mon.
    const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
    nextMonday.setUTCHours(10, 0, 0, 0);
    const endsAt = new Date(nextMonday);
    endsAt.setUTCHours(11, 0, 0, 0);
    return { startsAt: nextMonday, endsAt };
  }

  /**
   * Before each test, set up the mocks and create the use case
   */
  beforeEach(() => {
    mockAppointmentRepository = {
      create: jest.fn(),
      findByProfessionalId: jest.fn(),
      findByProfessionalIdAndDate: jest.fn(),
      findByClientId: jest.fn(),
      findOverlapping: jest.fn(),
    };
    mockAvailabilityRepository = {
      findByProfessionalIdAndDay: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findByProfessionalId: jest.fn(),
      deleteByProfessionalId: jest.fn(),
      findByProfessionalIdAndTimeRange: jest.fn(),
    };
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
      findProfessionalsPaginated: jest.fn(),
    };
    mockEnsureProfessionalExistsUseCase = {
      execute: jest.fn(),
      userRepository: mockUserRepository,
    } as unknown as jest.Mocked<EnsureProfessionalExistsUseCase>;
    mockIdGenerator = {
      generate: jest.fn(),
    };
    createAppointmentUseCase = new CreateAppointmentUseCase(
      mockAppointmentRepository,
      mockAvailabilityRepository,
      mockUserRepository,
      mockIdGenerator,
      mockEnsureProfessionalExistsUseCase,
    );
  });

  /**
   *  Happy path test for create appointment
   */
  it('should create an appointment successfully', async () => {
    const professional = createTestProfessional();
    const client = createTestClient();

    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };
    mockIdGenerator.generate.mockReturnValue('appointment_id');
    const appointment = new Appointment(
      'appointment_id',
      professional.id,
      client.id,
      startsAt,
      endsAt,
    );
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockUserRepository.findById.mockResolvedValue(client);
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockIdGenerator.generate.mockReturnValue('appointment_id');
    mockAppointmentRepository.create.mockResolvedValue(appointment);

    const output: CreateAppointmentOutput =
      await createAppointmentUseCase.execute(input);
    expect(output).toEqual(appointment);
  });

  /**
   * Test for creating an appointment when professional is not a professional
   */
  it('should throw an error when professional is not a professional', async () => {
    const professional = createTestProfessionalNotProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };
    mockEnsureProfessionalExistsUseCase.execute.mockRejectedValue(
      new Error('User is not a professional'),
    );
    mockUserRepository.findById.mockResolvedValue(professional);
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'User is not a professional',
    );
    expect(mockEnsureProfessionalExistsUseCase.execute).toHaveBeenCalledWith(
      professional.id,
    );
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(mockAppointmentRepository.findOverlapping).not.toHaveBeenCalled();
    expect(mockIdGenerator.generate).not.toHaveBeenCalled();
    expect(mockAppointmentRepository.create).not.toHaveBeenCalled();
  });

  /**
   * test for creating an appointment when it is in the past
   */
  it('should throw an error when it is in the past', async () => {
    const professional = createTestProfessional();
    const client = createTestClient();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: new Date('2026-01-05T10:00:00Z'),
      endsAt: new Date('2026-01-05T11:00:00Z'),
    };
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );

    mockUserRepository.findById.mockResolvedValue(client);
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockIdGenerator.generate.mockReturnValue('appointment_id');
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Cannot book appointments in the past',
    );
    expect(mockAppointmentRepository.create).not.toHaveBeenCalled();
    expect(mockEnsureProfessionalExistsUseCase.execute).toHaveBeenCalledWith(
      professional.id,
    );
    expect(mockUserRepository.findById).toHaveBeenCalledWith(client.id);
    expect(mockAppointmentRepository.findOverlapping).not.toHaveBeenCalled();
    expect(mockIdGenerator.generate).not.toHaveBeenCalled();
    expect(mockAppointmentRepository.create).not.toHaveBeenCalled();
    expect(
      mockAvailabilityRepository.findByProfessionalIdAndDay,
    ).not.toHaveBeenCalled();
  });
});
