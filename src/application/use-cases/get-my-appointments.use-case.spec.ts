// src/application/use-cases/get-my-appointments.use-case.spec.ts

import { GetMyAppointmentsUseCase } from './get-my-appointments.use-case';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { Appointment } from '../../domain/entities/appointment.entity';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

describe('GetMyAppointmentsUseCase', () => {
  let getMyAppointmentsUseCase: GetMyAppointmentsUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockFindByClientId: jest.MockedFunction<
    IAppointmentRepository['findByClientId']
  >;
  let mockFindByProfessionalId: jest.MockedFunction<
    IAppointmentRepository['findByProfessionalId']
  >;
  let mockFindById: jest.MockedFunction<IUserRepository['findById']>;

  const createAppointment = (
    id: string,
    professionalId: string,
    clientId: string,
    startsAt: Date,
  ): Appointment =>
    new Appointment(
      id,
      professionalId,
      clientId,
      startsAt,
      new Date(startsAt.getTime() + 3600000),
    );

  beforeEach(() => {
    mockFindByClientId = jest.fn();
    mockFindByProfessionalId = jest.fn();
    mockFindById = jest.fn();

    mockAppointmentRepository = {
      create: jest.fn(),
      findByProfessionalId: mockFindByProfessionalId,
      findByProfessionalIdAndDate: jest.fn(),
      findByClientId: mockFindByClientId,
      findOverlapping: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: mockFindById,
      findProfessionalsPaginated: jest.fn(),
    };

    getMyAppointmentsUseCase = new GetMyAppointmentsUseCase(
      mockAppointmentRepository,
      mockUserRepository,
    );
  });

  it('should return empty array when client has no appointments', async () => {
    mockFindByClientId.mockResolvedValue([]);

    const result = await getMyAppointmentsUseCase.execute(
      'client-123',
      Role.CLIENT,
    );

    expect(result).toEqual([]);
    expect(mockFindByClientId).toHaveBeenCalledWith('client-123');
    expect(mockFindByProfessionalId).not.toHaveBeenCalled();
  });

  it('should return appointments for client with professional and client names', async () => {
    const startsAt = new Date('2026-03-01T10:00:00Z');
    const appointments = [
      createAppointment('apt-1', 'prof-1', 'client-123', startsAt),
    ];

    mockFindByClientId.mockResolvedValue(appointments);
    mockFindById
      .mockResolvedValueOnce(
        new User('prof-1', 'p@x.com', 'hash', Role.PROFESSIONAL, 'John', 'Doe'),
      )
      .mockResolvedValueOnce(
        new User('client-123', 'c@x.com', 'hash', Role.CLIENT, 'Jane', 'Smith'),
      );

    const result = await getMyAppointmentsUseCase.execute(
      'client-123',
      Role.CLIENT,
    );

    expect(result).toHaveLength(1);
    expect(result[0].appointment.id).toBe('apt-1');
    expect(result[0].professional).toEqual({
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result[0].client).toEqual({ firstName: 'Jane', lastName: 'Smith' });
  });

  it('should return both asProfessional and asClient appointments for professional', async () => {
    const startsAt1 = new Date('2026-03-01T10:00:00Z');
    const startsAt2 = new Date('2026-03-02T14:00:00Z');

    const asProfessional = [
      createAppointment('apt-1', 'prof-123', 'client-1', startsAt1),
    ];
    const asClient = [
      createAppointment('apt-2', 'prof-2', 'prof-123', startsAt2),
    ];

    mockFindByProfessionalId.mockResolvedValue(asProfessional);
    mockFindByClientId.mockResolvedValue(asClient);

    mockFindById
      .mockResolvedValueOnce(
        new User(
          'prof-123',
          'p@x.com',
          'hash',
          Role.PROFESSIONAL,
          'John',
          'Doe',
        ),
      )
      .mockResolvedValueOnce(
        new User('client-1', 'c@x.com', 'hash', Role.CLIENT, 'Jane', 'Smith'),
      )
      .mockResolvedValueOnce(
        new User('prof-2', 'p2@x.com', 'hash', Role.PROFESSIONAL, 'Bob', 'Lee'),
      );

    const result = await getMyAppointmentsUseCase.execute(
      'prof-123',
      Role.PROFESSIONAL,
    );

    expect(result).toHaveLength(2);
    expect(mockFindByProfessionalId).toHaveBeenCalledWith('prof-123');
    expect(mockFindByClientId).toHaveBeenCalledWith('prof-123');
  });

  it('should use UNKNOWN_PARTY when user not found in userMap', async () => {
    const startsAt = new Date('2026-03-01T10:00:00Z');
    const appointments = [
      createAppointment('apt-1', 'prof-1', 'client-123', startsAt),
    ];

    mockFindByClientId.mockResolvedValue(appointments);
    mockFindById.mockResolvedValue(null);

    const result = await getMyAppointmentsUseCase.execute(
      'client-123',
      Role.CLIENT,
    );

    expect(result).toHaveLength(1);
    expect(result[0].professional).toEqual({
      firstName: 'Unknown',
      lastName: '',
    });
    expect(result[0].client).toEqual({ firstName: 'Unknown', lastName: '' });
  });

  it('should order appointments by startsAt', async () => {
    const startsAt1 = new Date('2026-03-02T14:00:00Z');
    const startsAt2 = new Date('2026-03-01T10:00:00Z');

    const appointments = [
      createAppointment('apt-1', 'prof-1', 'client-123', startsAt1),
      createAppointment('apt-2', 'prof-2', 'client-123', startsAt2),
    ];

    mockFindByClientId.mockResolvedValue(appointments);
    mockFindById.mockResolvedValue(
      new User('prof-1', 'p@x.com', 'hash', Role.PROFESSIONAL, 'John', 'Doe'),
    );

    const result = await getMyAppointmentsUseCase.execute(
      'client-123',
      Role.CLIENT,
    );

    expect(result[0].appointment.id).toBe('apt-2');
    expect(result[1].appointment.id).toBe('apt-1');
  });
});
