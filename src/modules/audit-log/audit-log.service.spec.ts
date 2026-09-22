import { AuditLogService } from './audit-log.service';
import { AuditLogModel } from './audit-log.constant';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: any;
  let logger: any;

  beforeEach(() => {
    auditLogRepository = {
      create: jest.fn().mockImplementation((data) => ({
        id: 100,
        ...data,
        createdAt: new Date(),
      })),
    };

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    service = new AuditLogService(auditLogRepository, logger);
  });

  describe('log', () => {
    it('ghi lại bản ghi AuditLog đủ actor, time, payload', async () => {
      const result = await service.log({
        actionById: 5,
        refModel: AuditLogModel.CUSTOMER,
        targetId: 10,
        diffs: [
          {
            field: 'name',
            oldValue: 'Tên Cũ',
            newValue: 'Tên Mới',
          },
        ],
        metadata: {
          action: 'APPROVE_EDIT',
          requestId: 12,
        },
      });

      expect(auditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionById: 5,
          refModel: AuditLogModel.CUSTOMER,
          targetId: 10,
          diffs: [
            {
              field: 'name',
              oldValue: 'Tên Cũ',
              newValue: 'Tên Mới',
            },
          ],
          metadata: {
            action: 'APPROVE_EDIT',
            requestId: 12,
          },
        }),
      );
      expect(result.id).toBe(100);
      expect(result.actionById).toBe(5);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('ghi nhận AuditLog thông qua EntityManager khi truyền vào transaction', async () => {
      const mockEntityManager: any = {
        getRepository: jest.fn().mockReturnValue({
          create: jest.fn().mockImplementation((d) => ({ ...d, id: 200 })),
          save: jest.fn().mockImplementation((d) => ({
            ...d,
            createdAt: new Date(),
          })),
        }),
      };

      const result = await service.log(
        {
          actionById: 1,
          refModel: AuditLogModel.CUSTOMER_REQUEST,
          targetId: 12,
          diffs: [],
          metadata: { action: 'APPROVE' },
        },
        mockEntityManager,
      );

      expect(mockEntityManager.getRepository).toHaveBeenCalled();
      expect(result.id).toBe(200);
    });
  });

  describe('computeDiffs', () => {
    it('tính toán chính xác các trường thay đổi giữa đối tượng cũ và mới', () => {
      const oldObj = {
        name: 'Công ty A',
        phone: '0901111111',
        address: 'Hà Nội',
        updatedAt: new Date('2026-01-01'),
      };

      const newObj = {
        name: 'Công ty B',
        phone: '0901111111',
        address: 'TP HCM',
        updatedAt: new Date('2026-02-02'),
      };

      const diffs = service.computeDiffs(oldObj, newObj);

      expect(diffs).toEqual([
        {
          field: 'name',
          oldValue: 'Công ty A',
          newValue: 'Công ty B',
        },
        {
          field: 'address',
          oldValue: 'Hà Nội',
          newValue: 'TP HCM',
        },
      ]);
    });

    it('trả về mảng rỗng nếu dữ liệu không có sự thay đổi', () => {
      const oldObj = { name: 'A', email: 'a@b.com' };
      const newObj = { name: 'A', email: 'a@b.com' };

      const diffs = service.computeDiffs(oldObj, newObj);
      expect(diffs).toEqual([]);
    });
  });
});
