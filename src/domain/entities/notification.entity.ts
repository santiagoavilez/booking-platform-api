import { NotificationChannel } from '../enums/notification-channel.enum';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}
export class Notification {
  constructor(
    public readonly id: string,
    public readonly recipientId: string,
    public readonly channel: NotificationChannel,
    public readonly message: string,
    public readonly createdAt: Date = new Date(),
    public readonly status: NotificationStatus = NotificationStatus.PENDING,
  ) {}
}
