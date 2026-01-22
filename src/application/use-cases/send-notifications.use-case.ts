// src/application/use-cases/send-notifications.use-case.ts

import { Injectable } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import { NotificationStatus } from '../../domain/entities/notification.entity';
import { type INotificationRepository } from '../../domain/repositories/notification.repository';
import { type INotificationSender } from '../../domain/services/notification-sender.interface';

/**
 * ARCHITECTURAL DECISION:
 * - What: Use case for sending notifications through multiple channels
 * - Why: Implements Strategy Pattern - allows adding new channels without modifying code
 * - Responsibilities:
 *   - Create notifications for each channel
 *   - Send through each channel using different strategies
 *   - Persist state of each notification
 *
 * PATTERN: Strategy Pattern
 * - Each channel (Email, SMS, Push) has its own strategy
 * - Use case orchestrates sending through all channels
 * - New channels are added without modifying this code (Open/Closed Principle)
 */
export interface SendNotificationInput {
  recipientId: string;
  message: string;
  channels: NotificationChannel[];
}

export interface SendNotificationOutput {
  notifications: Array<{
    id: string;
    channel: NotificationChannel;
    status: NotificationStatus;
  }>;
}

@Injectable()
export class SendNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    // This will be a factory that returns the correct strategy based on the channel
    // Will be implemented in infrastructure
    private readonly notificationSenderFactory: NotificationSenderFactory,
  ) {}

  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    const results: SendNotificationOutput['notifications'] = [];

    // For each requested channel
    for (const channel of input.channels) {
      // 1. Create notification (domain entity)
      const notification = new Notification(
        this.generateId(),
        input.recipientId,
        channel,
        input.message,
      );

      // 2. Persist notification (PENDING status)
      const savedNotification =
        await this.notificationRepository.create(notification);

      try {
        // 3. Get sending strategy for this channel
        const sender = this.notificationSenderFactory.getSender(channel);

        // 4. Send using the strategy
        await sender.send(savedNotification);

        // 5. Update status to SENT
        const updatedNotification =
          await this.notificationRepository.updateStatus(
            savedNotification.id,
            NotificationStatus.SENT,
          );

        results.push({
          id: updatedNotification.id,
          channel: updatedNotification.channel,
          status: updatedNotification.status,
        });
      } catch (error) {
        // 6. If it fails, update status to FAILED
        console.error('Error sending notification:', error);
        const failedNotification =
          await this.notificationRepository.updateStatus(
            savedNotification.id,
            NotificationStatus.FAILED,
          );

        results.push({
          id: failedNotification.id,
          channel: failedNotification.channel,
          status: failedNotification.status,
        });
      }
    }

    return { notifications: results };
  }

  private generateId(): string {
    // TODO: Implement unique ID generation
    throw new Error('ID generation not implemented');
  }
}

/**
 * Factory to get the correct sending strategy based on the channel
 * Will be implemented in infrastructure layer
 */
export interface NotificationSenderFactory {
  getSender(channel: NotificationChannel): INotificationSender;
}
