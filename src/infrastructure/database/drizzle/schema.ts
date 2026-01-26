// src/infrastructure/database/drizzle/schema.ts

import { pgTable, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for users table
 * Maps database structure to domain entities
 */
export const roleEnum = pgEnum('role', ['CLIENT', 'PROFESSIONAL']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Drizzle schema for refresh_tokens table
 * Stores refresh tokens for JWT token refresh functionality
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

/**
 * Drizzle schema for availability table
 * Stores weekly availability slots for professionals
 *
 * ARCHITECTURAL DECISION:
 * - What: Each row represents a single time slot for a professional on a specific day
 * - Why: Allows flexible scheduling with multiple slots per day
 * - dayOfWeek: 0-6 (Sunday-Saturday) following JavaScript Date convention
 * - startTime/endTime: HH:mm format for time-only storage
 */
export const availability = pgTable('availability', {
  id: text('id').primaryKey(),
  professionalId: text('professional_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: text('start_time').notNull(), // HH:mm format
  endTime: text('end_time').notNull(), // HH:mm format
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
