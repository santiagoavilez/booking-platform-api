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
