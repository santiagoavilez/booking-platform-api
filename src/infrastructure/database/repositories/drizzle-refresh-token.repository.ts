// src/infrastructure/database/repositories/drizzle-refresh-token.repository.ts

import { Injectable } from '@nestjs/common';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { refreshTokens } from '../drizzle/schema';
import type { DrizzleClient } from '../drizzle';

/**
 * ARCHITECTURAL DECISION:
 * - What: IRefreshTokenRepository implementation using Drizzle ORM
 * - Why: Drizzle is the chosen ORM for this project
 * - Maps between domain entities and database schema
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (IRefreshTokenRepository)
 * - Located in Infrastructure layer (technical persistence details)
 * - Only knows Drizzle schema, NOT the internal structure of RefreshToken entity
 * - Transforms between DB format and domain entity
 */
@Injectable()
export class DrizzleRefreshTokenRepository
  implements IRefreshTokenRepository
{
  constructor(private readonly db: DrizzleClient) {}

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const [created] = await this.db
      .insert(refreshTokens)
      .values({
        id: refreshToken.id,
        token: refreshToken.token,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
        revokedAt: refreshToken.revokedAt,
      })
      .returning();

    return this.toDomainEntity(created);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const [refreshToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    return refreshToken ? this.toDomainEntity(refreshToken) : null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokens = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    return tokens.map((token) => this.toDomainEntity(token));
  }

  async revoke(token: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  async deleteExpired(): Promise<void> {
    await this.db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));
  }

  /**
   * Maps database format to domain entity
   * This is the only transformation allowed in Infrastructure
   */
  private toDomainEntity(
    dbToken: typeof refreshTokens.$inferSelect,
  ): RefreshToken {
    return new RefreshToken(
      dbToken.id,
      dbToken.token,
      dbToken.userId,
      dbToken.expiresAt,
      dbToken.createdAt,
      dbToken.revokedAt,
    );
  }
}
