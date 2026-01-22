// src/application/use-cases/define-availability.use-case.ts

import { Injectable } from '@nestjs/common';
import { Availability } from '../../domain/entities/availability.entity';
import { type IAvailabilityRepository } from '../../domain/repositories/availability.repository';
import { type IUserRepository } from '../../domain/repositories/user.repository';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for defining weekly availability of professionals
 * - Why: Centralizes business validations (overlaps, format, etc.)
 * - Responsibilities:
 *   - Validate that user is a professional
 *   - Validate that there are no schedule overlaps
 *   - Create multiple availability slots
 */
export interface AvailabilitySlotInput {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface DefineAvailabilityInput {
  professionalId: string;
  slots: AvailabilitySlotInput[];
}

export interface DefineAvailabilityOutput {
  createdSlots: number;
}

@Injectable()
export class DefineAvailabilityUseCase {
  constructor(
    private readonly availabilityRepository: IAvailabilityRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    input: DefineAvailabilityInput,
  ): Promise<DefineAvailabilityOutput> {
    // 1. Validate that user exists and is a professional
    const user = await this.userRepository.findById(input.professionalId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.isProfessional()) {
      throw new Error('User is not a professional');
    }

    // 2. Delete existing availability (replace completely)
    await this.availabilityRepository.deleteByProfessionalId(
      input.professionalId,
    );

    // 3. Validate and create availability slots
    const availabilitySlots: Availability[] = [];
    for (const slot of input.slots) {
      // Validate day format (0-6)
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new Error(`Invalid day of week: ${slot.dayOfWeek}`);
      }

      // Validate time format (HH:mm)
      if (
        !this.isValidTimeFormat(slot.startTime) ||
        !this.isValidTimeFormat(slot.endTime)
      ) {
        throw new Error('Invalid time format. Use HH:mm');
      }

      // Validate that startTime < endTime
      if (slot.startTime >= slot.endTime) {
        throw new Error(`Invalid time range for day ${slot.dayOfWeek}`);
      }

      // Create domain entity
      const availability = new Availability(
        input.professionalId,
        slot.dayOfWeek,
        slot.startTime,
        slot.endTime,
      );

      availabilitySlots.push(availability);
    }

    // 4. Validate overlaps within new slots
    this.validateNoOverlaps(availabilitySlots);

    // 5. Persist all slots
    await this.availabilityRepository.createMany(availabilitySlots);

    return {
      createdSlots: availabilitySlots.length,
    };
  }

  /**
   * Validates that there are no overlaps between slots of the same day
   */
  private validateNoOverlaps(slots: Availability[]): void {
    // Group by day
    const slotsByDay = new Map<number, Availability[]>();
    for (const slot of slots) {
      if (!slotsByDay.has(slot.dayOfWeek)) {
        slotsByDay.set(slot.dayOfWeek, []);
      }
      slotsByDay.get(slot.dayOfWeek)!.push(slot);
    }

    // Validate overlaps by day
    for (const [day, daySlots] of slotsByDay.entries()) {
      // Sort by start time
      const sortedSlots = daySlots.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      // Verify that each slot does not overlap with the next one
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        if (current.endTime > next.startTime) {
          throw new Error(
            `Overlapping availability slots on day ${day}: ${current.startTime}-${current.endTime} overlaps with ${next.startTime}-${next.endTime}`,
          );
        }
      }
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }
}
