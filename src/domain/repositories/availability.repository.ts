// src/domain/repositories/availability.repository.ts

import { Availability } from '../entities/availability.entity';

/**
 * ARCHITECTURAL DECISION:
 * - What: Interface defining availability persistence operations
 * - Why: Follows DIP - Application layer depends on this abstraction
 * - Location: Domain layer (interfaces only, no implementations)
 *
 * CLEAN ARCHITECTURE:
 * - Defines contract that Infrastructure layer must implement
 * - Use cases depend on this interface, not concrete implementations
 */
export interface IAvailabilityRepository {
  /**
   * Creates a single availability slot
   */
  create(availability: Availability): Promise<Availability>;

  /**
   * Creates multiple availability slots in a batch
   * Used when defining a complete weekly schedule
   */
  createMany(availabilities: Availability[]): Promise<Availability[]>;

  /**
   * Finds all availability slots for a professional
   */
  findByProfessionalId(professionalId: string): Promise<Availability[]>;

  /**
   * Finds availability slots for a professional on a specific day
   */
  findByProfessionalIdAndDay(
    professionalId: string,
    dayOfWeek: number,
  ): Promise<Availability[]>;

  /**
   * Deletes all availability slots for a professional
   * Used when replacing the entire schedule
   */
  deleteByProfessionalId(professionalId: string): Promise<void>;

  /**
   * Finds availability slots that contain a specific time range
   * Used to check if a proposed appointment time is within availability
   */
  findByProfessionalIdAndTimeRange(
    professionalId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<Availability[]>;
}
