import { Injectable } from '@nestjs/common';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { Notification } from '../../domain/entities/notification.entity';

/**
 * Stub Push sender - MVP: logs only. Replace with FCM/APNs for production.
 */
@Injectable()
export class StubPushSender implements INotificationSender {
  async send(notification: Notification): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `[STUB PUSH] To: ${notification.recipientId} | ${notification.message}`,
        );
        resolve();
      }, 100);
    });
  }
}
