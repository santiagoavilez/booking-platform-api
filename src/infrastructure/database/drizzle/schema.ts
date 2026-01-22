// src/infrastructure/database/drizzle/schema.ts

import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for users table
 * Maps database structure to domain entities
 */
export const roleEnum = pgEnum('role', ['CLIENT', 'PROFESSIONAL']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
