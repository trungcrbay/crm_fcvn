import { NotificationService } from './notification.service';
import {
  NotificationActionType,
  NotificationType,
} from './notification.constant';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo: any;
  let recipientRepo: any;
  let logger: any;

  beforeEach(() => {
    notificationRepo = {
      create: jest.fn().mockImplementation((d) => ({ id: 1, ...d })),
      save: jest
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: 1, ...d })),
    };

    recipientRepo = {
      create: jest.fn().mockImplementation((d) => ({ id: 10, ...d })),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      count: jest.fn().mockResolvedValue(3),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 2 }),
      createQueryBuilder: jest.fn(),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    service = new NotificationService(notificationRepo, recipientRepo, logger);
  });

  describe('createNotification', () => {
    it('tạo thông báo và danh sách người nhận thành công', async () => {
      const result = await service.createNotification({
        title: '[Phê duyệt] Yêu cầu CR-01',
        content: 'Yêu cầu sửa khách hàng đã được phê duyệt',
        type: NotificationType.CUSTOMER_REQUEST,
        action: {
          type: NotificationActionType.CUSTOMER_REQUEST_DETAIL,
          refId: 1,
        },
        recipientIds: [5, 6],
        senderId: 1,
      });

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[Phê duyệt] Yêu cầu CR-01',
          type: NotificationType.CUSTOMER_REQUEST,
        }),
      );
      expect(recipientRepo.create).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'NOTIFICATION_SENT',
          recipientCount: 2,
        }),
      );
      expect(result.id).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('đếm số thông báo chưa đọc của user', async () => {
      const result = await service.getUnreadCount(5);
      expect(result).toEqual({ count: 3 });
      expect(recipientRepo.count).toHaveBeenCalledWith({
        where: {
          userId: 5,
          isRead: false,
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('đánh dấu 1 thông báo là đã đọc', async () => {
      const mockRecipient = {
        id: 10,
        userId: 5,
        isRead: false,
        readAt: null,
      };
      recipientRepo.findOne.mockResolvedValue(mockRecipient);
      recipientRepo.save.mockImplementation((d: any) => Promise.resolve(d));

      const result = await service.markAsRead(5, 10);
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it('ném NotFoundException nếu không tìm thấy thông báo', async () => {
      recipientRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead(5, 999)).rejects.toThrow();
    });
  });

  describe('markAllAsRead', () => {
    it('đánh dấu tất cả thông báo của user là đã đọc', async () => {
      const result = await service.markAllAsRead(5);
      expect(result).toEqual({ affected: 2 });
      expect(recipientRepo.update).toHaveBeenCalledWith(
        { userId: 5, isRead: false },
        expect.objectContaining({ isRead: true }),
      );
    });
  });
});
