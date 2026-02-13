import { Injectable } from '@nestjs/common';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { Notification } from '../../domain/entities/notification.entity';

/**
 * Stub Email sender - MVP: logs only. Replace with SendGrid/Resend for production.
 */
@Injectable()
export class StubEmailSender implements INotificationSender {
  async send(notification: Notification): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `[STUB EMAIL] To: ${notification.recipientId} | ${notification.message}`,
        );
        resolve();
      }, 100); // 100ms
    });
  }
}
