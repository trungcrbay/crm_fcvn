import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from 'src/shared/constant/purchase-request.constant';
import { Permission } from 'src/shared/constant/permission.constant';
import { PurchaseRequest } from './purchase-request.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { PurchaseRequestHistory } from './purchase-request-history.entity';
import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let dataSource: Partial<DataSource>;

  const mockPrRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockHistoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn((entity) => {
      if (entity === PurchaseRequest) return mockPrRepo;
      if (entity === PurchaseRequestItem) return mockItemRepo;
      if (entity === PurchaseRequestHistory) return mockHistoryRepo;
      return {};
    }),
  };

  beforeEach(async () => {
    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === PurchaseRequest) return mockPrRepo as any;
        if (entity === PurchaseRequestItem) return mockItemRepo as any;
        if (entity === PurchaseRequestHistory) return mockHistoryRepo as any;
        return {} as any;
      }),
      transaction: jest.fn(async (cb: any) => cb(mockManager as any)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<PurchaseRequestService>(PurchaseRequestService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('Happy path: tạo đề nghị mua hàng thành công và tự động tính tổng tiền', async () => {
      const dto = {
        title: 'Mua thiết bị IT',
        departmentId: 1,
        items: [
          { itemName: 'Laptop Dell', quantity: 2, price: 15000000 },
          { itemName: 'Chuột Logitech', quantity: 2, price: 500000 },
        ],
      };

      const mockSavedPR = {
        id: 10,
        code: 'PR-20260822123456',
        title: dto.title,
        status: PurchaseRequestStatus.DRAFT,
        totalAmount: 31000000,
      };

      mockPrRepo.create.mockReturnValue(mockSavedPR);
      mockPrRepo.save.mockResolvedValue(mockSavedPR);
      mockItemRepo.create.mockImplementation((item) => item);
      mockItemRepo.save.mockResolvedValue([
        { id: 1, ...dto.items[0], amount: 30000000 },
        { id: 2, ...dto.items[1], amount: 1000000 },
      ]);
      mockHistoryRepo.create.mockReturnValue({ id: 1 });
      mockHistoryRepo.save.mockResolvedValue({ id: 1 });

      const result = await service.create(dto, 1);

      expect(result.totalAmount).toBe(31000000);
      expect(result.status).toBe(PurchaseRequestStatus.DRAFT);
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('Negative path: ném ConflictException nếu không có item nào', async () => {
      const dto = {
        title: 'Mua thiết bị IT',
        items: [],
      };

      await expect(service.create(dto as any, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('Happy path: cập nhật thành công khi ở trạng thái DRAFT', async () => {
      mockPrRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          status: PurchaseRequestStatus.DRAFT,
          totalAmount: 30000000,
          items: [{ id: 1, itemName: 'Old item' }],
        })
        .mockResolvedValueOnce({
          id: 10,
          title: 'Tiêu đề mới',
          status: PurchaseRequestStatus.DRAFT,
          totalAmount: 20000000,
        });

      mockItemRepo.delete.mockResolvedValue({ affected: 1 });
      mockItemRepo.create.mockImplementation((item) => item);
      mockItemRepo.save.mockResolvedValue([
        {
          id: 2,
          itemName: 'Item mới',
          quantity: 1,
          price: 20000000,
          amount: 20000000,
        },
      ]);
      mockPrRepo.update.mockResolvedValue({ affected: 1 });
      mockHistoryRepo.create.mockReturnValue({ id: 2 });
      mockHistoryRepo.save.mockResolvedValue({ id: 2 });

      const result = await service.update(
        10,
        {
          title: 'Tiêu đề mới',
          items: [{ itemName: 'Item mới', quantity: 1, price: 20000000 }],
        },
        1,
      );

      expect(result.title).toBe('Tiêu đề mới');
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('Negative path: ném NotFoundException nếu không tìm thấy đề nghị', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update(999, { title: 'New' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('Negative path: ném ConflictException nếu trạng thái không phải DRAFT', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        status: PurchaseRequestStatus.PENDING_APPROVAL,
      });

      await expect(
        service.update(10, { title: 'New' } as any, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submit', () => {
    it('Happy path: gửi duyệt thành công chuyển từ DRAFT sang PENDING_APPROVAL', async () => {
      mockPrRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          status: PurchaseRequestStatus.DRAFT,
          items: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          id: 10,
          status: PurchaseRequestStatus.PENDING_APPROVAL,
          submittedAt: new Date(),
          items: [{ id: 1 }],
        });

      mockPrRepo.update.mockResolvedValue({ affected: 1 });
      mockHistoryRepo.create.mockReturnValue({ id: 3 });
      mockHistoryRepo.save.mockResolvedValue({ id: 3 });

      const result = await service.submit(10, 1);

      expect(result.status).toBe(PurchaseRequestStatus.PENDING_APPROVAL);
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('Negative path: ném ConflictException nếu gửi duyệt khi không ở DRAFT', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        status: PurchaseRequestStatus.APPROVED,
        items: [{ id: 1 }],
      });

      await expect(service.submit(10, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('approve', () => {
    it('Happy path: duyệt thành công khi đúng trạng thái PENDING_APPROVAL', async () => {
      mockPrRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          departmentId: 1,
          status: PurchaseRequestStatus.PENDING_APPROVAL,
          items: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          id: 10,
          departmentId: 1,
          status: PurchaseRequestStatus.APPROVED,
          approvedAt: new Date(),
          items: [{ id: 1 }],
        });

      mockPrRepo.update.mockResolvedValue({ affected: 1 });
      mockHistoryRepo.create.mockReturnValue({ id: 4 });
      mockHistoryRepo.save.mockResolvedValue({ id: 4 });

      const result = await service.approve(10, 1, 1, [
        Permission.PURCHASE_REQUEST_APPROVE,
      ]);

      expect(result.status).toBe(PurchaseRequestStatus.APPROVED);
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('Negative path: ném ForbiddenException nếu duyệt sai phòng ban', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        departmentId: 2,
        status: PurchaseRequestStatus.PENDING_APPROVAL,
        items: [{ id: 1 }],
      });

      await expect(
        service.approve(10, 1, 1, [Permission.PURCHASE_REQUEST_APPROVE]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Negative path: ném ConflictException nếu duyệt bản ghi không ở PENDING_APPROVAL', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        departmentId: 1,
        status: PurchaseRequestStatus.APPROVED,
        items: [{ id: 1 }],
      });

      await expect(
        service.approve(10, 1, 1, [Permission.PURCHASE_REQUEST_APPROVE]),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('Happy path: từ chối thành công có lý do và chuyển sang REJECTED', async () => {
      mockPrRepo.findOne
        .mockResolvedValueOnce({
          id: 10,
          departmentId: 1,
          status: PurchaseRequestStatus.PENDING_APPROVAL,
          items: [{ id: 1 }],
        })
        .mockResolvedValueOnce({
          id: 10,
          departmentId: 1,
          status: PurchaseRequestStatus.REJECTED,
          rejectReason: 'Vượt ngân sách cho phép',
          rejectedAt: new Date(),
          items: [{ id: 1 }],
        });

      mockPrRepo.update.mockResolvedValue({ affected: 1 });
      mockHistoryRepo.create.mockReturnValue({ id: 5 });
      mockHistoryRepo.save.mockResolvedValue({ id: 5 });

      const result = await service.reject(
        10,
        { reason: 'Vượt ngân sách cho phép' },
        1,
        1,
        [Permission.PURCHASE_REQUEST_REJECT],
      );

      expect(result.status).toBe(PurchaseRequestStatus.REJECTED);
      expect(result.rejectReason).toBe('Vượt ngân sách cho phép');
      expect(mockHistoryRepo.save).toHaveBeenCalled();
    });

    it('Negative path: ném ConflictException nếu lý do rỗng', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        departmentId: 1,
        status: PurchaseRequestStatus.PENDING_APPROVAL,
      });

      await expect(
        service.reject(10, { reason: '   ' } as any, 1, 1, [
          Permission.PURCHASE_REQUEST_REJECT,
        ]),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('Happy path: xóa thành công khi ở trạng thái DRAFT', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        status: PurchaseRequestStatus.DRAFT,
      });

      mockItemRepo.update.mockResolvedValue({ affected: 1 });
      mockPrRepo.update.mockResolvedValue({ affected: 1 });
      mockHistoryRepo.create.mockReturnValue({ id: 6 });
      mockHistoryRepo.save.mockResolvedValue({ id: 6 });

      const result = await service.remove(10, 1);

      expect(result.message).toBe('Xóa đề nghị mua hàng thành công');
    });

    it('Negative path: ném ConflictException nếu xóa bản ghi không ở DRAFT', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({
        id: 10,
        status: PurchaseRequestStatus.PENDING_APPROVAL,
      });

      await expect(service.remove(10, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('getHistory', () => {
    it('Happy path: lấy danh sách lịch sử thay đổi trạng thái', async () => {
      mockPrRepo.findOne.mockResolvedValueOnce({ id: 10 });
      mockHistoryRepo.find.mockResolvedValueOnce([
        {
          id: 1,
          action: PurchaseRequestAction.CREATE,
          toStatus: PurchaseRequestStatus.DRAFT,
        },
        {
          id: 2,
          action: PurchaseRequestAction.SUBMIT,
          toStatus: PurchaseRequestStatus.PENDING_APPROVAL,
        },
      ]);

      const history = await service.getHistory(10);

      expect(history.length).toBe(2);
      expect(history[1].action).toBe(PurchaseRequestAction.SUBMIT);
    });
  });
});
