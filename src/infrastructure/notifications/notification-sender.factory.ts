import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { INotificationSenderFactory } from '../../domain/services/notification-sender-factory.interface';

/**
 * ARCHITECTURAL DECISION:
 * - What: INotificationSenderFactory implementation (Strategy Pattern)
 * - Why: Returns the correct sender strategy based on channel - OCP compliant
 * - Location: Infrastructure - implements domain interface
 *
 * CLEAN ARCHITECTURE:
 * - Implements domain interface INotificationSenderFactory
 * - Application layer depends on interface, not this class (DIP)
 */
@Injectable()
export class NotificationSenderFactoryImpl implements INotificationSenderFactory {
  private readonly strategyMapper: Record<
    NotificationChannel,
    INotificationSender
  >;
  constructor(
    emailSender: INotificationSender,
    smsSender: INotificationSender,
    pushSender: INotificationSender,
    whatsappSender: INotificationSender,
  ) {
    this.strategyMapper = {
      [NotificationChannel.EMAIL]: emailSender,
      [NotificationChannel.SMS]: smsSender,
      [NotificationChannel.PUSH]: pushSender,
      [NotificationChannel.WHATSAPP]: whatsappSender,
    };
  }

  getSender(channel: NotificationChannel): INotificationSender {
    const sender = this.strategyMapper[channel];
    if (!sender) {
      throw new Error(`No sender found for channel: ${channel}`);
    }
    return sender;
  }
}
