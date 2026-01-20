import { Availability } from '../entities/availability.entity';

export interface IAvailabilityRepository {
  create(availability: Availability): Promise<Availability>;
  createMany(availabilities: Availability[]): Promise<Availability[]>;
  findByProfessionalId(professionalId: string): Promise<Availability[]>;
  findByProfessionalIdAndDay(
    professionalId: string,
    dayOfWeek: number,
  ): Promise<Availability[]>;
  deleteByProfessionalId(professionalId: string): Promise<void>;
  findByProfessionalIdAndTimeRange(
    professionalId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<Availability[]>;
}
