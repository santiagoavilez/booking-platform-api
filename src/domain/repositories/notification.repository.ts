import {
  Notification,
  NotificationStatus,
} from '../entities/notification.entity';

export interface INotificationRepository {
  create(notification: Notification): Promise<Notification>;
  createMany(notifications: Notification[]): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  findByRecipientId(recipientId: string): Promise<Notification[]>;
  updateStatus(id: string, status: NotificationStatus): Promise<Notification>;
  findByRecipientIdAndChannel(
    recipientId: string,
    channel: string,
  ): Promise<Notification[]>;
}
