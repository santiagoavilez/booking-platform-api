import { Notification } from '../entities/notification.entity';

export interface INotificationSender {
  send(notification: Notification): Promise<void>;
}
