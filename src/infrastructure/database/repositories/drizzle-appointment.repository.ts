// src/infrastructure/database/repositories/drizzle-appointment.repository.ts

import { Injectable } from '@nestjs/common';
import { eq, and, lt, gt, gte } from 'drizzle-orm';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { IAppointmentRepository } from '../../../domain/repositories/appointment.repository';
import { appointments } from '../drizzle/schema';
import type { DrizzleClient } from '../drizzle';

/**
 * ARCHITECTURAL DECISION:
 * - What: IAppointmentRepository implementation using Drizzle ORM
 * - Why: Drizzle is the chosen ORM for this project
 * - Maps between domain entities and database schema
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IAppointmentRepository)
 * - Located in Infrastructure layer (technical persistence details)
 * - Transforms between DB format and domain entity
 */
@Injectable()
export class DrizzleAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(appointment: Appointment): Promise<Appointment> {
    const [created] = await this.db
      .insert(appointments)
      .values({
        id: appointment.id,
        professionalId: appointment.professionalId,
        clientId: appointment.clientId,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
      })
      .returning();

    return this.toDomainEntity(created);
  }

  async findByProfessionalId(professionalId: string): Promise<Appointment[]> {
    const results = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.professionalId, professionalId));

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Finds appointments for a professional on a given date (YYYY-MM-DD).
   * Uses UTC: start of date 00:00:00.000Z to start of next day (exclusive).
   */
  async findByProfessionalIdAndDate(
    professionalId: string,
    date: string,
  ): Promise<Appointment[]> {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const startOfNextDay = new Date(
      new Date(startOfDay).setUTCDate(startOfDay.getUTCDate() + 1),
    );

    const results = await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          gte(appointments.startsAt, startOfDay),
          lt(appointments.startsAt, startOfNextDay),
        ),
      );

    return results.map((row) => this.toDomainEntity(row));
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    const results = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId));

    return results.map((row) => this.toDomainEntity(row));
  }

  async findOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]> {
    // Overlap: existing.startsAt < endsAt AND existing.endsAt > startsAt
    const results = await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          lt(appointments.startsAt, endsAt),
          gt(appointments.endsAt, startsAt),
        ),
      );

    return results.map((row) => this.toDomainEntity(row));
  }

  private toDomainEntity(row: typeof appointments.$inferSelect): Appointment {
    return new Appointment(
      row.id,
      row.professionalId,
      row.clientId,
      row.startsAt,
      row.endsAt,
      row.createdAt,
      row.updatedAt,
    );
  }
}
