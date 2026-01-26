// src/infrastructure/database/repositories/drizzle-user.repository.ts

import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/enums/role.enum';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { users } from '../drizzle/schema';
import type { DrizzleClient } from '../drizzle';

/**
 * ARCHITECTURAL DECISION:
 * - What: IUserRepository implementation using Drizzle ORM
 * - Why: Drizzle is the chosen ORM for this project
 * - Maps between domain entities and database schema
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IUserRepository)
 * - Located in Infrastructure layer (technical persistence details)
 * - Only knows Drizzle schema, NOT the internal structure of User entity
 * - Transforms between DB format and domain entity
 */
@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(user: User): Promise<User> {
    // Map domain entity to database format
    const [created] = await this.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash: user.getPasswordHash(),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      })
      .returning();

    // Map database format to domain entity
    return this.toDomainEntity(created);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ? this.toDomainEntity(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ? this.toDomainEntity(user) : null;
  }

  /**
   * Maps database format to domain entity
   * This is the only transformation allowed in Infrastructure
   */
  private toDomainEntity(dbUser: typeof users.$inferSelect): User {
    return new User(
      dbUser.id,
      dbUser.email,
      dbUser.passwordHash,
      dbUser.role as Role, // Cast needed because pgEnum returns a specific type
      dbUser.firstName,
      dbUser.lastName,
    );
  }
}
