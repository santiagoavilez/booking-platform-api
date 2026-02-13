import { NotificationChannel } from '../enums/notification-channel.enum';
import type { INotificationSender } from './notification-sender.interface';

/**
 * ARCHITECTURAL DECISION:
 * - What: Factory interface to get the correct notification sender by channel
 * - Why: Strategy Pattern - application needs a way to obtain the right strategy without knowing implementations
 * - Location: Domain layer - defines the contract that infrastructure must fulfill (DIP)
 *
 * CLEAN ARCHITECTURE:
 * - Domain defines what the application needs from infrastructure
 * - Infrastructure implements NotificationSenderFactoryImpl
 * - Use case depends on this interface, not on concrete implementations
 */
export interface INotificationSenderFactory {
  getSender(channel: NotificationChannel): INotificationSender;
}
