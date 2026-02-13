import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { INotificationRepository } from '../../../domain/repositories/notification.repository';
import {
  Notification,
  NotificationStatus,
} from '../../../domain/entities/notification.entity';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum';
import { notifications } from '../drizzle/schema';
import type { DrizzleClient } from '../drizzle';

type NotificationRow = typeof notifications.$inferSelect;

/**
 * ARCHITECTURAL DECISION:
 * - What: INotificationRepository implementation using Drizzle ORM
 * - Why: Drizzle is the chosen ORM for this project
 * - Maps between domain entities and database schema
 *
 * CLEAN ARCHITECTURE:
 * - Implements Domain interface (INotificationRepository)
 * - Located in Infrastructure layer (technical persistence details)
 * - Transforms between DB format and domain entity
 */
@Injectable()
export class DrizzleNotificationRepository implements INotificationRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(notification: Notification): Promise<Notification> {
    const [created] = await this.db
      .insert(notifications)
      .values({
        id: notification.id,
        recipientId: notification.recipientId,
        message: notification.message,
        channel: notification.channel,
        status: notification.status,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create notification');
    }

    return this.toDomainEntity(created);
  }

  async createMany(
    notificationsToCreate: Notification[],
  ): Promise<Notification[]> {
    const values = notificationsToCreate.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      message: n.message,
      channel: n.channel,
      status: n.status,
    }));

    const rows = await this.db.insert(notifications).values(values).returning();

    return rows.map((row) => this.toDomainEntity(row));
  }
  async findById(id: string): Promise<Notification | null> {
    const [result] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return result ? this.toDomainEntity(result) : null;
  }
  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, recipientId));
    return result.map((row) => this.toDomainEntity(row));
  }
  async updateStatus(
    id: string,
    status: NotificationStatus,
  ): Promise<Notification> {
    const [updated] = await this.db
      .update(notifications)
      .set({ status, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Notification ${id} not found`);
    }

    return this.toDomainEntity(updated);
  }

  async findByRecipientIdAndChannel(
    recipientId: string,
    channel: string,
  ): Promise<Notification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, recipientId),
          eq(notifications.channel, channel as NotificationChannel),
        ),
      );
    return result.map((row) => this.toDomainEntity(row));
  }
  private toDomainEntity(row: NotificationRow): Notification {
    return new Notification(
      row.id,
      row.recipientId,
      row.channel as NotificationChannel,
      row.message,
      row.createdAt,
      row.status as NotificationStatus,
    );
  }
}
