// src/application/use-cases/send-notifications.use-case.spec.ts

import { SendNotificationsUseCase } from './send-notifications.use-case';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import type { INotificationSenderFactory } from '../../domain/services/notification-sender-factory.interface';
import type { IIdGenerator } from '../../domain/services/id-generator.interface';
import {
  Notification,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';

describe('SendNotificationsUseCase', () => {
  let useCase: SendNotificationsUseCase;
  let mockNotificationRepository: jest.Mocked<INotificationRepository>;
  let mockNotificationSenderFactory: jest.Mocked<INotificationSenderFactory>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockCreate: jest.MockedFunction<INotificationRepository['create']>;
  let mockUpdateStatus: jest.MockedFunction<
    INotificationRepository['updateStatus']
  >;
  let mockGetSender: jest.MockedFunction<
    INotificationSenderFactory['getSender']
  >;
  let mockGenerate: jest.MockedFunction<IIdGenerator['generate']>;

  beforeEach(() => {
    mockCreate = jest.fn();
    mockUpdateStatus = jest.fn();
    mockGetSender = jest.fn();
    mockGenerate = jest.fn();

    mockNotificationRepository = {
      create: mockCreate,
      createMany: jest.fn(),
      findById: jest.fn(),
      findByRecipientId: jest.fn(),
      updateStatus: mockUpdateStatus,
      findByRecipientIdAndChannel: jest.fn(),
    };

    // Mock sender that resolves
    const mockSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationSenderFactory = {
      getSender: mockGetSender.mockReturnValue(mockSender),
    };

    let idCounter = 0;
    mockGenerate.mockImplementation(() => `notif-${++idCounter}`);
    mockIdGenerator = {
      generate: mockGenerate,
    };

    useCase = new SendNotificationsUseCase(
      mockNotificationRepository,
      mockNotificationSenderFactory,
      mockIdGenerator,
    );
  });

  it('should send notifications successfully and return SENT status', async () => {
    const input = {
      recipientId: 'user-123',
      message: 'Hello',
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
    };

    mockCreate.mockImplementation((n) => Promise.resolve(n));
    mockUpdateStatus.mockImplementation((id, status) =>
      Promise.resolve(
        new Notification(
          id,
          'user-123',
          NotificationChannel.EMAIL,
          'Hello',
          new Date(),
          status,
        ),
      ),
    );

    const result = await useCase.execute(input);

    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].status).toBe(NotificationStatus.SENT);
    expect(result.notifications[1].status).toBe(NotificationStatus.SENT);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockUpdateStatus).toHaveBeenCalledTimes(2);
  });

  it('should return FAILED status when sender throws', async () => {
    const input = {
      recipientId: 'user-123',
      message: 'Hello',
      channels: [NotificationChannel.EMAIL],
    };

    const createdNotification = new Notification(
      'notif-1',
      'user-123',
      NotificationChannel.EMAIL,
      'Hello',
    );

    mockCreate.mockResolvedValue(createdNotification);
    mockGetSender.mockReturnValue({
      send: jest.fn().mockRejectedValue(new Error('Send failed')),
    });
    mockUpdateStatus.mockImplementation((id) =>
      Promise.resolve(
        new Notification(
          id,
          'user-123',
          NotificationChannel.EMAIL,
          'Hello',
          new Date(),
          NotificationStatus.FAILED,
        ),
      ),
    );

    const result = await useCase.execute(input);

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].status).toBe(NotificationStatus.FAILED);
    expect(mockUpdateStatus).toHaveBeenCalledWith(
      'notif-1',
      NotificationStatus.FAILED,
    );
  });

  it('should return empty notifications when no channels provided', async () => {
    const result = await useCase.execute({
      recipientId: 'user-123',
      message: 'Hello',
      channels: [],
    });

    expect(result.notifications).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
