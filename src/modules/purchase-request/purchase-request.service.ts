import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { PurchaseRequest } from './purchase-request.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { PurchaseRequestHistory } from './purchase-request-history.entity';
import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from 'src/shared/constant/purchase-request.constant';
import {
  CreatePurchaseRequestBodyDTO,
  GetPurchaseRequestsQueryDTO,
  RejectPurchaseRequestBodyDTO,
  UpdatePurchaseRequestBodyDTO,
} from './purchase-request.dto';
import { generatePurchaseRequestCode } from 'src/shared/utils';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import { Permission } from 'src/shared/constant/permission.constant';

@Injectable()
export class PurchaseRequestService {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    dto: CreatePurchaseRequestBodyDTO,
    userId: number,
  ): Promise<PurchaseRequest> {
    if (!dto.items?.length) {
      throw new ConflictException(
        'Đề nghị mua hàng phải có ít nhất một sản phẩm',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const itemRepository = manager.getRepository(PurchaseRequestItem);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      const totalAmount = dto.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price),
        0,
      );

      const purchaseRequest = prRepository.create({
        code: generatePurchaseRequestCode(),
        title: dto.title,
        description: dto.description,
        departmentId: dto.departmentId,
        status: PurchaseRequestStatus.DRAFT,
        totalAmount,
        createdById: userId,
        updatedById: userId,
      });

      const savedPurchaseRequest = await prRepository.save(purchaseRequest);

      const items = dto.items.map((item) =>
        itemRepository.create({
          purchaseRequestId: savedPurchaseRequest.id,
          itemName: item.itemName,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          amount: Number(item.quantity) * Number(item.price),
          note: item.note,
          createdById: userId,
          updatedById: userId,
        }),
      );

      await itemRepository.save(items);

      const history = historyRepository.create({
        purchaseRequestId: savedPurchaseRequest.id,
        toStatus: PurchaseRequestStatus.DRAFT,
        action: PurchaseRequestAction.CREATE,
        changedById: userId,
      });

      await historyRepository.save(history);

      return {
        ...savedPurchaseRequest,
        items,
      };
    });
  }

  async update(
    id: number,
    dto: UpdatePurchaseRequestBodyDTO,
    userId: number,
  ): Promise<PurchaseRequest> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
        relations: { items: true },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.DRAFT) {
      throw new ConflictException(
        'Chỉ được phép chỉnh sửa đề nghị ở trạng thái DRAFT',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const itemRepository = manager.getRepository(PurchaseRequestItem);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      let totalAmount = existing.totalAmount;
      let updatedItems = existing.items;

      if (dto.items && dto.items.length > 0) {
        // Xóa items cũ và tạo items mới
        await itemRepository.delete({ purchaseRequestId: id });

        totalAmount = dto.items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.price),
          0,
        );

        const newItems = dto.items.map((item) =>
          itemRepository.create({
            purchaseRequestId: id,
            itemName: item.itemName,
            unit: item.unit,
            quantity: item.quantity,
            price: item.price,
            amount: Number(item.quantity) * Number(item.price),
            note: item.note,
            createdById: userId,
            updatedById: userId,
          }),
        );

        updatedItems = await itemRepository.save(newItems);
      }

      await prRepository.update(id, {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.departmentId !== undefined && {
          departmentId: dto.departmentId,
        }),
        totalAmount,
        updatedById: userId,
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.DRAFT,
        toStatus: PurchaseRequestStatus.DRAFT,
        action: PurchaseRequestAction.UPDATE,
        changedById: userId,
      });

      await historyRepository.save(history);

      const updatedRequest = await prRepository.findOne({
        where: { id },
      });

      return {
        ...updatedRequest!,
        items: updatedItems,
      };
    });
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.DRAFT) {
      throw new ConflictException(
        'Chỉ được phép xóa đề nghị ở trạng thái DRAFT',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const itemRepository = manager.getRepository(PurchaseRequestItem);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      await itemRepository.update(
        { purchaseRequestId: id },
        { deletedById: userId, deletedAt: new Date() },
      );

      await prRepository.update(id, {
        deletedById: userId,
        deletedAt: new Date(),
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.DRAFT,
        toStatus: PurchaseRequestStatus.DRAFT,
        action: PurchaseRequestAction.DELETE,
        changedById: userId,
      });

      await historyRepository.save(history);
    });

    return { message: 'Xóa đề nghị mua hàng thành công' };
  }

  async submit(id: number, userId: number): Promise<PurchaseRequest> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
        relations: { items: true },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.DRAFT) {
      throw new ConflictException(
        'Chỉ đề nghị ở trạng thái DRAFT mới có thể gửi duyệt',
      );
    }

    if (!existing.items || existing.items.length === 0) {
      throw new ConflictException(
        'Đề nghị mua hàng phải có ít nhất 1 sản phẩm trước khi gửi duyệt',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      const submittedAt = new Date();

      await prRepository.update(id, {
        status: PurchaseRequestStatus.PENDING_APPROVAL,
        submittedAt,
        updatedById: userId,
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.DRAFT,
        toStatus: PurchaseRequestStatus.PENDING_APPROVAL,
        action: PurchaseRequestAction.SUBMIT,
        changedById: userId,
      });

      await historyRepository.save(history);

      const updated = await prRepository.findOne({
        where: { id },
        relations: { items: true },
      });

      return updated!;
    });
  }

  async approve(
    id: number,
    userId: number,
    userDepartmentId?: number,
    userPermissions: Permission[] = [],
  ): Promise<PurchaseRequest> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
        relations: { items: true },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Chỉ đề nghị ở trạng thái PENDING_APPROVAL mới có thể phê duyệt',
      );
    }

    // Kiểm tra phòng ban nếu không phải toàn quyền Manage
    const hasFullManage =
      userPermissions.includes(Permission.PURCHASE_REQUEST_MANAGE) ||
      userPermissions.includes(Permission.USER_MANAGE);

    if (!hasFullManage && userDepartmentId && existing.departmentId) {
      if (userDepartmentId !== existing.departmentId) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền phê duyệt đề nghị thuộc phòng ban của mình',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      const approvedAt = new Date();

      await prRepository.update(id, {
        status: PurchaseRequestStatus.APPROVED,
        approvedAt,
        updatedById: userId,
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.PENDING_APPROVAL,
        toStatus: PurchaseRequestStatus.APPROVED,
        action: PurchaseRequestAction.APPROVE,
        changedById: userId,
      });

      await historyRepository.save(history);

      const updated = await prRepository.findOne({
        where: { id },
        relations: { items: true },
      });

      return updated!;
    });
  }

  async reject(
    id: number,
    dto: RejectPurchaseRequestBodyDTO,
    userId: number,
    userDepartmentId?: number,
    userPermissions: Permission[] = [],
  ): Promise<PurchaseRequest> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
        relations: { items: true },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    if (existing.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new ConflictException(
        'Chỉ đề nghị ở trạng thái PENDING_APPROVAL mới có thể từ chối',
      );
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new ConflictException('Lý do từ chối không được để trống');
    }

    // Kiểm tra phòng ban nếu không phải toàn quyền Manage
    const hasFullManage =
      userPermissions.includes(Permission.PURCHASE_REQUEST_MANAGE) ||
      userPermissions.includes(Permission.USER_MANAGE);

    if (!hasFullManage && userDepartmentId && existing.departmentId) {
      if (userDepartmentId !== existing.departmentId) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền từ chối đề nghị thuộc phòng ban của mình',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequest);
      const historyRepository = manager.getRepository(PurchaseRequestHistory);

      const rejectedAt = new Date();

      await prRepository.update(id, {
        status: PurchaseRequestStatus.REJECTED,
        rejectedAt,
        rejectReason: dto.reason.trim(),
        updatedById: userId,
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.PENDING_APPROVAL,
        toStatus: PurchaseRequestStatus.REJECTED,
        action: PurchaseRequestAction.REJECT,
        reason: dto.reason.trim(),
        changedById: userId,
      });

      await historyRepository.save(history);

      const updated = await prRepository.findOne({
        where: { id },
        relations: { items: true },
      });

      return updated!;
    });
  }

  async findAll(
    query: GetPurchaseRequestsQueryDTO = {
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
    },
  ): Promise<PaginatedResult<PurchaseRequest>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const where: FindOptionsWhere<PurchaseRequest> = {};

    if (query.search) {
      where.code = ILike(`%${query.search.trim()}%`);
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.createdById) {
      where.createdById = query.createdById;
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = Between(
        new Date(query.fromDate),
        new Date(query.toDate),
      );
    } else if (query.fromDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.fromDate));
    } else if (query.toDate) {
      where.createdAt = LessThanOrEqual(new Date(query.toDate));
    }

    const [data, total] = await this.dataSource
      .getRepository(PurchaseRequest)
      .findAndCount({
        where,
        relations: { items: true },
        skip,
        take: safeLimit,
        order: {
          createdAt: query.sortOrder ?? 'DESC',
        },
      });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async findOne(id: number): Promise<PurchaseRequest> {
    const purchaseRequest = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
        relations: { items: true },
      });

    if (!purchaseRequest) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    return purchaseRequest;
  }

  async getHistory(id: number): Promise<PurchaseRequestHistory[]> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequest)
      .findOne({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    return this.dataSource.getRepository(PurchaseRequestHistory).find({
      where: { purchaseRequestId: id },
      order: { changedAt: 'ASC' },
    });
  }
}
