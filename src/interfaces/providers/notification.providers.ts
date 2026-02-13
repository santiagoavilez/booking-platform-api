// src/interfaces/providers/notification.providers.ts

import { Provider } from '@nestjs/common';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import type { INotificationSender } from '../../domain/services/notification-sender.interface';
import type { INotificationSenderFactory } from '../../domain/services/notification-sender-factory.interface';
import { DrizzleNotificationRepository } from '../../infrastructure/database/repositories/drizzle-notification.repository';
import { NotificationSenderFactoryImpl } from '../../infrastructure/notifications/notification-sender.factory';
import { StubEmailSender } from '../../infrastructure/notifications/stub-email.strategy';
import { StubSmsSender } from '../../infrastructure/notifications/stub-sms.strategy';
import { StubPushSender } from '../../infrastructure/notifications/stub-push.strategy';
import { StubWhatsappSender } from '../../infrastructure/notifications/stub-whatsapp.strategy';
import { DRIZZLE_CLIENT } from './database.providers';
import type { DrizzleClient } from '../../infrastructure/database/drizzle';

/**
 * Tokens for dependency injection
 */
export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');
export const NOTIFICATION_SENDER_FACTORY = Symbol('NotificationSenderFactory');
export const EMAIL_SENDER = Symbol('EmailSender');
export const SMS_SENDER = Symbol('SmsSender');
export const PUSH_SENDER = Symbol('PushSender');
export const WHATSAPP_SENDER = Symbol('WhatsappSender');

/**
 * Stub strategy providers - MVP: log only. Replace with real implementations (SendGrid, Twilio, FCM) for production.
 */
export const emailSenderProvider: Provider<INotificationSender> = {
  provide: EMAIL_SENDER,
  useClass: StubEmailSender,
};

export const smsSenderProvider: Provider<INotificationSender> = {
  provide: SMS_SENDER,
  useClass: StubSmsSender,
};

export const pushSenderProvider: Provider<INotificationSender> = {
  provide: PUSH_SENDER,
  useClass: StubPushSender,
};

export const whatsappSenderProvider: Provider<INotificationSender> = {
  provide: WHATSAPP_SENDER,
  useClass: StubWhatsappSender,
};

/**
 * Repository provider - connects domain interface with Drizzle implementation
 */
export const notificationRepositoryProvider: Provider<INotificationRepository> =
  {
    provide: NOTIFICATION_REPOSITORY,
    useFactory: (drizzleClient: DrizzleClient): INotificationRepository => {
      return new DrizzleNotificationRepository(drizzleClient);
    },
    inject: [DRIZZLE_CLIENT],
  };

/**
 * Factory provider - connects domain interface with implementation
 * Injects strategy instances by channel (Strategy Pattern)
 */
export const notificationSenderFactoryProvider: Provider<INotificationSenderFactory> =
  {
    provide: NOTIFICATION_SENDER_FACTORY,
    useFactory: (
      email: INotificationSender,
      sms: INotificationSender,
      push: INotificationSender,
      whatsapp: INotificationSender,
    ): INotificationSenderFactory =>
      new NotificationSenderFactoryImpl(email, sms, push, whatsapp),
    inject: [EMAIL_SENDER, SMS_SENDER, PUSH_SENDER, WHATSAPP_SENDER],
  };
