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

  // After the existing mock object declarations (around line 74), add:

  let mockEnsureExecute: jest.MockedFunction<
    EnsureProfessionalExistsUseCase['execute']
  >;
  let mockFindById: jest.MockedFunction<IUserRepository['findById']>;
  let mockFindByProfessionalIdAndDay: jest.MockedFunction<
    IAvailabilityRepository['findByProfessionalIdAndDay']
  >;
  let mockFindOverlapping: jest.MockedFunction<
    IAppointmentRepository['findOverlapping']
  >;
  let mockGenerate: jest.MockedFunction<IIdGenerator['generate']>;
  let mockCreate: jest.MockedFunction<IAppointmentRepository['create']>;
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
    // Create individual mock functions first (avoids unbound-method)
    mockEnsureExecute = jest.fn();
    mockFindById = jest.fn();
    mockFindByProfessionalIdAndDay = jest.fn();
    mockFindOverlapping = jest.fn();
    mockGenerate = jest.fn();
    mockCreate = jest.fn();

    mockAppointmentRepository = {
      create: mockCreate,
      findByProfessionalId: jest.fn(),
      findByProfessionalIdAndDate: jest.fn(),
      findByClientId: jest.fn(),
      findOverlapping: mockFindOverlapping,
    };
    mockAvailabilityRepository = {
      findByProfessionalIdAndDay: mockFindByProfessionalIdAndDay,
      create: jest.fn(),
      createMany: jest.fn(),
      findByProfessionalId: jest.fn(),
      deleteByProfessionalId: jest.fn(),
      findByProfessionalIdAndTimeRange: jest.fn(),
    };
    mockUserRepository = {
      findById: mockFindById,
      create: jest.fn(),
      findByEmail: jest.fn(),
      findProfessionalsPaginated: jest.fn(),
    };
    mockEnsureProfessionalExistsUseCase = {
      execute: mockEnsureExecute,
      userRepository: mockUserRepository,
    } as unknown as jest.Mocked<EnsureProfessionalExistsUseCase>;
    mockIdGenerator = {
      generate: mockGenerate,
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
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt,
      endsAt,
    };
    const appointmentId = 'appointment_id';
    const expectedAppointment = new Appointment(
      appointmentId,
      professional.id,
      client.id,
      startsAt,
      endsAt,
    );

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockIdGenerator.generate.mockReturnValue(appointmentId);
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockUserRepository.findById.mockResolvedValue(client);
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockAppointmentRepository.create.mockResolvedValue(expectedAppointment);

    // --- ACT: execute the use case ---
    const output: CreateAppointmentOutput =
      await createAppointmentUseCase.execute(input);

    // --- ASSERT: outcome and collaboration ---
    expect(output).toEqual(expectedAppointment);
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindByProfessionalIdAndDay).toHaveBeenCalledWith(
      professional.id,
      1,
    );
    expect(mockFindOverlapping).toHaveBeenCalledWith(
      professional.id,
      startsAt,
      endsAt,
    );
    expect(mockGenerate).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith(expectedAppointment);
  });

  /**
   * Test for creating an appointment when professional is not a professional
   */
  it('should throw an error when professional is not a professional', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessionalNotProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockEnsureExecute.mockRejectedValue(
      new Error('User is not a professional'),
    );
    mockFindById.mockResolvedValue(professional);

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'User is not a professional',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  /**
   * test for error: Client not found
   */
  it('should throw an error when client not found', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockUserRepository.findById.mockResolvedValue(null);

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Client not found',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFindByProfessionalIdAndDay).not.toHaveBeenCalled();
  });

  /**
   * test for error: Professional cannot book an appointment with themselves
   */
  it('should throw an error when professional cannot book an appointment with themselves', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: professional.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockUserRepository.findById.mockResolvedValue(professional);
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockIdGenerator.generate.mockReturnValue('appointment_id');

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Professional cannot book an appointment with themselves',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFindByProfessionalIdAndDay).not.toHaveBeenCalled();
  });
  /**
   * test for creating an appointment when it is in the past
   */
  it('should throw an error when it is in the past', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: new Date(Date.now() - 86400000), // 1 day before now
      endsAt: new Date(Date.now() - 86400000 + 3600000), // 1 hour after startsAt
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );

    mockUserRepository.findById.mockResolvedValue(client);
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockIdGenerator.generate.mockReturnValue('appointment_id');

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Cannot book appointments in the past',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFindByProfessionalIdAndDay).not.toHaveBeenCalled();
  });

  /**
   * test for erro startsAt is greater than endsAt
   */
  it('should throw an error when startsAt is greater than endsAt', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: endsAt,
      endsAt: startsAt,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockUserRepository.findById.mockResolvedValue(client);
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockAppointmentRepository.findOverlapping.mockResolvedValue([]);
    mockIdGenerator.generate.mockReturnValue('appointment_id');

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Invalid appointment duration',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });
  /**
   * test for creating an appointment when it is not within the professional's availability
   */
  it('should throw an error when the professional has no availability', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockUserRepository.findById.mockResolvedValue(client);
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue([]);

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Professional is not available on this day',
    );
    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindByProfessionalIdAndDay).toHaveBeenCalledWith(
      professional.id,
      1,
    );
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  /**
   * Slots for the day exist but the requested time is outside the range "Requested time is not within professional availability
   */
  it('should throw an error when the requested time is outside the range: Requested time is not within professional availability', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt } = getNextMondayAt10UTC();
    // 3 hours before startsAt and 3 hours after endsAt
    const startsAtOutsideRange = new Date(startsAt.getTime() - 10800000);
    // 1 hour after startsAtOutsideRange
    const endsAtOutsideRange = new Date(
      startsAtOutsideRange.getTime() + 3600000,
    );
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAtOutsideRange,
      endsAt: endsAtOutsideRange,
    };

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockUserRepository.findById.mockResolvedValue(client);
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Requested time is not within professional availability',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindOverlapping).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  /**
   * test for error: Professional already has an appointment at this time
   */
  it('should throw an error when professional already has an appointment at this time', async () => {
    // --- ARRANGE: test data and input ---
    const professional = createTestProfessional();
    const client = createTestClient();
    const { startsAt, endsAt } = getNextMondayAt10UTC();
    const input: CreateAppointmentInput = {
      professionalId: professional.id,
      clientId: client.id,
      startsAt: startsAt,
      endsAt: endsAt,
    };
    const appointment = new Appointment(
      'appointment_id',
      professional.id,
      client.id,
      startsAt,
      endsAt,
    );

    // --- ARRANGE: mock responses (dependencies return values) ---
    mockUserRepository.findById.mockResolvedValue(client);
    mockEnsureProfessionalExistsUseCase.execute.mockResolvedValue(professional);
    mockAvailabilityRepository.findByProfessionalIdAndDay.mockResolvedValue(
      availableSlots as Availability[],
    );
    mockAppointmentRepository.findOverlapping.mockResolvedValue([appointment]);

    // --- ACT: execute the use case ---
    await expect(createAppointmentUseCase.execute(input)).rejects.toThrow(
      'Professional already has an appointment at this time',
    );

    // --- ASSERT: outcome and collaboration ---
    expect(mockEnsureExecute).toHaveBeenCalledWith(professional.id);
    expect(mockFindById).toHaveBeenCalledWith(client.id);
    expect(mockFindOverlapping).toHaveBeenCalledWith(
      professional.id,
      startsAt,
      endsAt,
    );
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
