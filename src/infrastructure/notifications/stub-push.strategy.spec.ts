// src/infrastructure/notifications/stub-push.strategy.spec.ts

import { StubPushSender } from './stub-push.strategy';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';

describe('StubPushSender', () => {
  let sender: StubPushSender;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    sender = new StubPushSender();
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
      NotificationChannel.PUSH,
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
      NotificationChannel.PUSH,
      'Hello World',
    );

    const promise = sender.send(notification);
    await jest.advanceTimersByTimeAsync(100);
    await promise;

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[STUB PUSH] To: user-123 | Hello World',
    );
  });
});
