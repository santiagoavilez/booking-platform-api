import { Injectable } from '@nestjs/common';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { Notification } from '../../domain/entities/notification.entity';

/**
 * Stub SMS sender - MVP: logs only. Replace with Twilio/SNS for production.
 */
@Injectable()
export class StubSmsSender implements INotificationSender {
  async send(notification: Notification): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `[STUB SMS] To: ${notification.recipientId} | ${notification.message}`,
        );
        resolve();
      }, 100);
    });
  }
}
