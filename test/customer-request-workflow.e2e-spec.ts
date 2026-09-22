import { BadRequestException, ConflictException } from '@nestjs/common';
import { CustomerRequestService } from '../src/modules/customer-request/customer-request.service';
import {
  CustomerRequestAction,
  CustomerRequestStatus,
} from '../src/shared/constant/customer-request.constant';
import {
  AppointmentStatus,
  CustomerStatus,
  CustomerType,
  GroupType,
} from '../src/shared/constant/customer.constant';
import { AuditLogModel } from '../src/modules/audit-log/audit-log.constant';
import { AuditLogService } from '../src/modules/audit-log/audit-log.service';
import {
  NotificationActionType,
  NotificationType,
} from '../src/modules/notifications/notification.constant';
import { NotificationService } from '../src/modules/notifications/notification.service';

describe('Customer Request Workflow E2E', () => {
  let service: CustomerRequestService;
  let customers: Map<number, any>;
  let requests: Map<number, any>;
  let appointments: Map<number, any>;
  let auditLogs: any[];
  let notifications: any[];
  let recipients: any[];

  const perf: Array<{ scenario: string; ms: number; pass: boolean }> = [];
  const SALE = 101;
  const MANAGER = 1;

  const seedCustomer = (id: number, name = `Customer ${id}`, owner = SALE) => {
    const c = {
      id,
      customerCode: `CUS-${id}`,
      name,
      phone: '0912345678',
      email: `c${id}@fcvn.com`,
      customerType: CustomerType.CORPORATE,
      groupType: GroupType.VIP,
      status: CustomerStatus.ACTIVE,
      saleOwnerId: owner,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    customers.set(id, c);
    return c;
  };

  const measure = async <T>(
    scenario: string,
    fn: () => Promise<T>,
  ): Promise<T> => {
    const t0 = performance.now();
    const result = await fn();
    const ms = performance.now() - t0;
    perf.push({ scenario, ms, pass: ms <= 2000 });
    expect(ms).toBeLessThanOrEqual(2000);
    return result;
  };

  const buildMocks = () => {
    const customerRepo = {
      findOne: jest.fn((opt: any) => {
        const id = typeof opt === 'number' ? opt : (opt?.where?.id ?? opt?.id);
        const c = customers.get(id);
        return Promise.resolve(c ? { ...c } : null);
      }),
      update: jest.fn((id: number, data: any) => {
        const e = customers.get(id);
        if (e) customers.set(id, { ...e, ...data });
        return Promise.resolve({ affected: 1 });
      }),
    };

    const requestRepo = {
      findOne: jest.fn((opt: any) => {
        const id = opt?.where?.id ?? opt;
        const r = requests.get(id);
        if (!r) return Promise.resolve(null);
        return Promise.resolve({
          ...r,
          customer: customers.get(r.customerId)
            ? { ...customers.get(r.customerId) }
            : null,
          createdBy: { id: r.createdById, name: 'Sale' },
          approvedBy: r.approvedById
            ? { id: r.approvedById, name: 'Manager' }
            : null,
        });
      }),
      findOneBy: jest.fn((q: any) => {
        if (q.id) {
          const r = requests.get(q.id);
          return Promise.resolve(r ? { ...r } : null);
        }
        for (const r of requests.values()) {
          if (
            r.customerId === q.customerId &&
            r.actionType === q.actionType &&
            r.status === q.status
          )
            return Promise.resolve({ ...r });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn((data: any) => {
        const id = requests.size + 1;
        const r = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        requests.set(id, r);
        return Promise.resolve({ ...r });
      }),
      update: jest.fn((id: number, data: any) => {
        const e = requests.get(id);
        if (e) requests.set(id, { ...e, ...data });
        return Promise.resolve({ affected: 1 });
      }),
    };

    const apptRepo = {
      findOne: jest.fn((opt: any) => {
        const { customerId, status } = opt?.where ?? {};
        for (const a of appointments.values())
          if (a.customerId === customerId && a.status === status)
            return Promise.resolve({ ...a });
        return Promise.resolve(null);
      }),
    };

    const dataSource: any = {
      transaction: jest.fn(async (cb: any) =>
        cb({
          getRepository: (entity: any) => {
            const n = typeof entity === 'function' ? entity.name : entity;
            if (n === 'Customer') return customerRepo;
            if (n === 'CustomerAppointment') return apptRepo;
            if (n === 'AuditLog')
              return {
                create: (d: any) => d,
                save: (d: any) => {
                  auditLogs.push(d);
                  return Promise.resolve(d);
                },
              };
            if (n === 'Notification')
              return {
                create: (d: any) => d,
                save: (d: any) => {
                  notifications.push(d);
                  return Promise.resolve(d);
                },
              };
            if (n === 'NotificationRecipient')
              return {
                create: (d: any) => d,
                save: (d: any) => {
                  (Array.isArray(d) ? d : [d]).forEach((x) =>
                    recipients.push(x),
                  );
                  return Promise.resolve(d);
                },
              };
            return requestRepo;
          },
        }),
      ),
    };

    const logger: any = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const auditSvc = new AuditLogService(
      {
        create: jest.fn((d: any) => {
          auditLogs.push(d);
          return Promise.resolve(d);
        }),
      } as any,
      logger,
    );
    const notifSvc = new NotificationService(
      {
        create: (d: any) => d,
        save: (d: any) => {
          notifications.push(d);
          return Promise.resolve(d);
        },
      } as any,
      {
        create: (d: any) => d,
        save: (d: any) => {
          (Array.isArray(d) ? d : [d]).forEach((x) => recipients.push(x));
          return Promise.resolve(d);
        },
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn(),
        update: jest.fn(),
        createQueryBuilder: jest.fn(),
      } as any,
      logger,
    );

    return {
      customerRepo,
      requestRepo,
      dataSource,
      logger,
      auditSvc,
      notifSvc,
    };
  };

  beforeEach(() => {
    customers = new Map();
    requests = new Map();
    appointments = new Map();
    auditLogs = [];
    notifications = [];
    recipients = [];
    const m = buildMocks();
    service = new CustomerRequestService(
      m.requestRepo as any,
      m.customerRepo as any,
      m.dataSource,
      m.logger,
      m.auditSvc,
      m.notifSvc,
    );
  });

  const expectAudit = (model: string, targetId: number, action?: string) => {
    const a = auditLogs.find(
      (x) =>
        x.refModel === model &&
        x.targetId === targetId &&
        (!action || x.metadata?.action === action),
    );
    expect(a).toBeDefined();
    return a;
  };

  describe('EDIT flow', () => {
    it('APPROVE: cập nhật customer, audit diff, notify sale, latency <=2s', async () => {
      seedCustomer(10, 'Công ty ABC');
      const req = await service.create(
        {
          customerId: 10,
          actionType: CustomerRequestAction.EDIT,
          proposedData: { name: 'Công Ty Đã Đổi Tên', phone: '0988776655' },
          reason: 'Cập nhật GPKD mới',
        },
        { userId: SALE },
      );

      expect(req.status).toBe(CustomerRequestStatus.PENDING);
      expectAudit(AuditLogModel.CUSTOMER_REQUEST, req.id, 'CREATE_REQUEST');

      const approved = await measure('EDIT - APPROVE', () =>
        service.approve(req.id, MANAGER),
      );
      expect(approved.status).toBe(CustomerRequestStatus.APPROVED);

      const c = customers.get(10)!;
      expect(c).toMatchObject({
        name: 'Công Ty Đã Đổi Tên',
        phone: '0988776655',
      });

      const audit = expectAudit(AuditLogModel.CUSTOMER, 10);
      expect(audit.diffs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            oldValue: 'Công ty ABC',
            newValue: 'Công Ty Đã Đổi Tên',
          }),
          expect.objectContaining({
            field: 'phone',
            oldValue: '0912345678',
            newValue: '0988776655',
          }),
        ]),
      );

      const notif = notifications.find(
        (n) => n.type === NotificationType.CUSTOMER_REQUEST,
      )!;
      expect(notif.title).toContain('[Phê duyệt]');
      expect(notif.action.type).toBe(
        NotificationActionType.CUSTOMER_REQUEST_DETAIL,
      );
      expect(recipients.find((r) => r.userId === SALE)?.isRead).toBe(false);
    });

    it('REJECT: giữ nguyên data, lưu lý do, notify, latency <=2s', async () => {
      seedCustomer(20, 'Công Ty Giữ Nguyên');
      const req = await service.create(
        {
          customerId: 20,
          actionType: CustomerRequestAction.EDIT,
          proposedData: { name: 'Tên Không Hợp Lệ' },
          reason: 'Sửa tên',
        },
        { userId: SALE },
      );

      const rejected = await measure('EDIT - REJECT', () =>
        service.reject(req.id, { reason: 'Thiếu bản sao công chứng' }, MANAGER),
      );

      expect(rejected.status).toBe(CustomerRequestStatus.REJECTED);
      expect(rejected.rejectReason).toBe('Thiếu bản sao công chứng');
      expect(customers.get(20)!.name).toBe('Công Ty Giữ Nguyên');

      const audit = expectAudit(
        AuditLogModel.CUSTOMER_REQUEST,
        req.id,
        'REJECT',
      );
      expect(audit.metadata.rejectReason).toBe('Thiếu bản sao công chứng');
      expect(
        notifications.find((n) => n.title.includes('[Từ chối]'))?.content,
      ).toContain('Thiếu bản sao công chứng');
    });
  });

  describe('DELETE flow', () => {
    it('APPROVE: soft-delete + audit, latency <=2s', async () => {
      seedCustomer(30, 'Công Ty Cần Xóa');
      const req = await service.create(
        {
          customerId: 30,
          actionType: CustomerRequestAction.DELETE,
          reason: 'Giải thể',
        },
        { userId: SALE },
      );

      await measure('DELETE - APPROVE', () => service.approve(req.id, MANAGER));

      const c = customers.get(30)!;
      expect(c.deletedAt).toBeInstanceOf(Date);
      expect(c.deletedById).toBe(MANAGER);
      expect(expectAudit(AuditLogModel.CUSTOMER, 30).diffs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'deletedAt' }),
        ]),
      );
    });

    it('BLOCK khi có appointment SCHEDULED -> BadRequest', async () => {
      seedCustomer(40, 'Khách Có Lịch');
      appointments.set(101, {
        id: 101,
        customerId: 40,
        status: AppointmentStatus.SCHEDULED,
      });
      const req = await service.create(
        {
          customerId: 40,
          actionType: CustomerRequestAction.DELETE,
          reason: 'Ngừng hợp tác',
        },
        { userId: SALE },
      );

      await expect(service.approve(req.id, MANAGER)).rejects.toThrow(
        BadRequestException,
      );
      expect(customers.get(40)!.deletedAt).toBeUndefined();
      expect(requests.get(req.id)!.status).toBe(CustomerRequestStatus.PENDING);
    });
  });

  describe('Concurrency', () => {
    it('duyệt trùng lặp -> Conflict', async () => {
      seedCustomer(50, 'Khách Race');
      const req = await service.create(
        {
          customerId: 50,
          actionType: CustomerRequestAction.EDIT,
          proposedData: { name: 'Tên Sửa' },
          reason: 'Sửa',
        },
        { userId: SALE },
      );

      await service.approve(req.id, MANAGER);
      await expect(service.approve(req.id, MANAGER)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  afterAll(() => {
    console.table(
      perf.map((p) => ({
        scenario: p.scenario,
        ms: p.ms.toFixed(2),
        pass: p.pass,
      })),
    );
  });
});

//chạy test: npx jest --config test/jest-e2e.json --no-coverage
