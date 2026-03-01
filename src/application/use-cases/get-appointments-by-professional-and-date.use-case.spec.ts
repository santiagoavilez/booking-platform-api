// src/application/use-cases/get-appointments-by-professional-and-date.use-case.spec.ts

import { GetAppointmentsByProfessionalAndDateUseCase } from './get-appointments-by-professional-and-date.use-case';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { Appointment } from '../../domain/entities/appointment.entity';

describe('GetAppointmentsByProfessionalAndDateUseCase', () => {
  let useCase: GetAppointmentsByProfessionalAndDateUseCase;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockFindByProfessionalIdAndDate: jest.MockedFunction<
    IAppointmentRepository['findByProfessionalIdAndDate']
  >;

  beforeEach(() => {
    mockFindByProfessionalIdAndDate = jest.fn();

    mockAppointmentRepository = {
      create: jest.fn(),
      findByProfessionalId: jest.fn(),
      findByProfessionalIdAndDate: mockFindByProfessionalIdAndDate,
      findByClientId: jest.fn(),
      findOverlapping: jest.fn(),
    };

    useCase = new GetAppointmentsByProfessionalAndDateUseCase(
      mockAppointmentRepository,
    );
  });

  it('should delegate to findByProfessionalIdAndDate with correct args', async () => {
    const professionalId = 'prof-123';
    const date = '2026-03-01';
    const appointments = [
      new Appointment(
        'apt-1',
        professionalId,
        'client-1',
        new Date('2026-03-01T10:00:00Z'),
        new Date('2026-03-01T11:00:00Z'),
      ),
    ];

    mockFindByProfessionalIdAndDate.mockResolvedValue(appointments);

    const result = await useCase.execute(professionalId, date);

    expect(result).toEqual(appointments);
    expect(mockFindByProfessionalIdAndDate).toHaveBeenCalledTimes(1);
    expect(mockFindByProfessionalIdAndDate).toHaveBeenCalledWith(
      professionalId,
      date,
    );
  });

  it('should return empty array when no appointments found', async () => {
    mockFindByProfessionalIdAndDate.mockResolvedValue([]);

    const result = await useCase.execute('prof-123', '2026-03-01');

    expect(result).toEqual([]);
  });
});
