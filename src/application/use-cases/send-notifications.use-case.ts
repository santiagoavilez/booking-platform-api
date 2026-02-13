// src/application/use-cases/send-notifications.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import {
  Notification,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import type { IIdGenerator } from '../../domain/services/id-generator.interface';
import type { INotificationSenderFactory } from '../../domain/services/notification-sender-factory.interface';
import {
  ID_GENERATOR,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_SENDER_FACTORY,
} from '../../interfaces/providers';

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
 *
 * DIP: Depends on INotificationRepository and INotificationSenderFactory (domain interfaces)
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
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(NOTIFICATION_SENDER_FACTORY)
    private readonly notificationSenderFactory: INotificationSenderFactory,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Send notifications to the recipient
   * @param input - The input for the use case SendNotificationInput {
   * - recipientId: The ID of the recipient
   * - message: The message to send
   * - channels: The channels to send the notification through
   * }
   * @returns The output of the use case
   */
  async execute(input: SendNotificationInput): Promise<SendNotificationOutput> {
    const results: SendNotificationOutput['notifications'] = [];

    // For each requested channel
    for (const channel of input.channels) {
      // 1. Create notification (domain entity)
      const notification = new Notification(
        this.idGenerator.generate(),
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
}
