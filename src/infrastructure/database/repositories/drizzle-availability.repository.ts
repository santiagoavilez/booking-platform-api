// src/infrastructure/database/repositories/drizzle-availability.repository.ts

import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { Availability } from '../../../domain/entities/availability.entity';
import { IAvailabilityRepository } from '../../../domain/repositories/availability.repository';
import { availability } from '../drizzle/schema';
import type { DrizzleClient } from '../drizzle';

/**
 * ARCHITECTURAL DECISION:
 * - What: IAvailabilityRepository implementation using Drizzle ORM
 * - Why: Drizzle is the chosen ORM for this project
 * - Maps between domain entities and database schema
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IAvailabilityRepository)
 * - Located in Infrastructure layer (technical persistence details)
 * - Transforms between DB format and domain entity
 */
@Injectable()
export class DrizzleAvailabilityRepository implements IAvailabilityRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(availabilityEntity: Availability): Promise<Availability> {
    const [created] = await this.db
      .insert(availability)
      .values({
        id: availabilityEntity.id,
        professionalId: availabilityEntity.professionalId,
        dayOfWeek: availabilityEntity.dayOfWeek,
        startTime: availabilityEntity.startTime,
        endTime: availabilityEntity.endTime,
      })
      .returning();

    return this.toDomainEntity(created);
  }

  async createMany(availabilities: Availability[]): Promise<Availability[]> {
    if (availabilities.length === 0) {
      return [];
    }

    const values = availabilities.map((a) => ({
      id: a.id,
      professionalId: a.professionalId,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    }));

    const created = await this.db
      .insert(availability)
      .values(values)
      .returning();

    return created.map((row) => this.toDomainEntity(row));
  }

  async findByProfessionalId(professionalId: string): Promise<Availability[]> {
    const results = await this.db
      .select()
      .from(availability)
      .where(eq(availability.professionalId, professionalId));

    return results.map((row) => this.toDomainEntity(row));
  }

  async findByProfessionalIdAndDay(
    professionalId: string,
    dayOfWeek: number,
  ): Promise<Availability[]> {
    const results = await this.db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.professionalId, professionalId),
          eq(availability.dayOfWeek, dayOfWeek),
        ),
      );

    return results.map((row) => this.toDomainEntity(row));
  }

  async deleteByProfessionalId(professionalId: string): Promise<void> {
    await this.db
      .delete(availability)
      .where(eq(availability.professionalId, professionalId));
  }

  async findByProfessionalIdAndTimeRange(
    professionalId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<Availability[]> {
    // Find all slots for the professional on that day
    // Then filter in memory for slots that contain the time range
    const slots = await this.findByProfessionalIdAndDay(
      professionalId,
      dayOfWeek,
    );

    // Filter slots where the requested time range fits within the slot
    return slots.filter(
      (slot) => slot.startTime <= startTime && slot.endTime >= endTime,
    );
  }

  /**
   * Maps database format to domain entity
   */
  private toDomainEntity(
    dbRow: typeof availability.$inferSelect,
  ): Availability {
    return new Availability(
      dbRow.id,
      dbRow.professionalId,
      dbRow.dayOfWeek,
      dbRow.startTime,
      dbRow.endTime,
    );
  }
}
