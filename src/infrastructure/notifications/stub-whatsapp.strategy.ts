import { Injectable } from '@nestjs/common';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { Notification } from '../../domain/entities/notification.entity';

/**
 * Stub WhatsApp sender - MVP: logs only. Replace with WhatsApp Business API for production.
 */
@Injectable()
export class StubWhatsappSender implements INotificationSender {
  async send(notification: Notification): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `[STUB WHATSAPP] To: ${notification.recipientId} | ${notification.message}`,
        );
        resolve();
      }, 100);
    });
  }
}
