// src/infrastructure/notifications/stub-sms.strategy.spec.ts

import { StubSmsSender } from './stub-sms.strategy';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';

describe('StubSmsSender', () => {
  let sender: StubSmsSender;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    sender = new StubSmsSender();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
  });

  it('should resolve after sending', async () => {
    const notification = new Notification(
      'id-1',
      'user-123',
      NotificationChannel.SMS,
      'Test message',
    );

    const promise = sender.send(notification);
    await jest.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should log recipient and message', async () => {
    const notification = new Notification(
      'id-1',
      'user-123',
      NotificationChannel.SMS,
      'Hello World',
    );

    const promise = sender.send(notification);
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[STUB SMS] To: user-123 | Hello World',
    );
  });
});
