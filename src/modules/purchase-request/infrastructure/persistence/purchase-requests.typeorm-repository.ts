import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { PaginatedResult } from 'src/shared/repositories/base.repository';
import {
  PurchaseRequestAction,
  PurchaseRequestStatus,
} from 'src/shared/constant/purchase-request.constant';
import {
  CreatePurchaseRequestData,
  IPurchaseRequestsRepository,
  PurchaseRequestQueryFilter,
  UpdatePurchaseRequestData,
} from '../../domain/repositories/purchase-request.repository.interface';
import { PurchaseRequestEntity } from '../../domain/entities/purchase-request.entity';
import { PurchaseRequestHistoryEntity } from '../../domain/entities/purchase-request-history.entity';
import { PurchaseRequestOrmEntity } from './purchase-request.orm-entity';
import { PurchaseRequestItemOrmEntity } from './purchase-request-item.orm-entity';
import { PurchaseRequestHistoryOrmEntity } from './purchase-request-history.orm-entity';
import { PurchaseRequestMapper } from './purchase-request.mapper';

@Injectable()
export class PurchaseRequestsTypeOrmRepository implements IPurchaseRequestsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    data: CreatePurchaseRequestData,
    code: string,
    userId: number,
  ): Promise<PurchaseRequestEntity> {
    if (!data.items?.length) {
      throw new ConflictException(
        'Đề nghị mua hàng phải có ít nhất một sản phẩm',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const itemRepository = manager.getRepository(
        PurchaseRequestItemOrmEntity,
      );
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

      const totalAmount = data.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.price),
        0,
      );

      const purchaseRequest = prRepository.create({
        code,
        title: data.title,
        description: data.description ?? undefined,
        departmentId: data.departmentId ?? undefined,
        status: PurchaseRequestStatus.DRAFT,
        totalAmount,
        createdById: userId,
        updatedById: userId,
      });

      const savedPurchaseRequest = await prRepository.save(purchaseRequest);

      const items = data.items.map((item) =>
        itemRepository.create({
          purchaseRequestId: savedPurchaseRequest.id,
          itemName: item.itemName,
          unit: item.unit ?? undefined,
          quantity: item.quantity,
          price: item.price,
          amount: Number(item.quantity) * Number(item.price),
          note: item.note ?? undefined,
          createdById: userId,
          updatedById: userId,
        }),
      );

      const savedItems = await itemRepository.save(items);

      const history = historyRepository.create({
        purchaseRequestId: savedPurchaseRequest.id,
        toStatus: PurchaseRequestStatus.DRAFT,
        action: PurchaseRequestAction.CREATE,
        changedById: userId,
      });

      await historyRepository.save(history);

      savedPurchaseRequest.items = savedItems;
      return PurchaseRequestMapper.toDomain(savedPurchaseRequest);
    });
  }

  async update(
    id: number,
    data: UpdatePurchaseRequestData,
    userId: number,
  ): Promise<PurchaseRequestEntity> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequestOrmEntity)
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
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const itemRepository = manager.getRepository(
        PurchaseRequestItemOrmEntity,
      );
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

      let totalAmount = existing.totalAmount;
      let updatedItems = existing.items;

      if (data.items && data.items.length > 0) {
        await itemRepository.delete({ purchaseRequestId: id });

        totalAmount = data.items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.price),
          0,
        );

        const newItems = data.items.map((item) =>
          itemRepository.create({
            purchaseRequestId: id,
            itemName: item.itemName,
            unit: item.unit ?? undefined,
            quantity: item.quantity,
            price: item.price,
            amount: Number(item.quantity) * Number(item.price),
            note: item.note ?? undefined,
            createdById: userId,
            updatedById: userId,
          }),
        );

        updatedItems = await itemRepository.save(newItems);
      }

      await prRepository.update(id, {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description ?? undefined,
        }),
        ...(data.departmentId !== undefined && {
          departmentId: data.departmentId ?? undefined,
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

      if (!updatedRequest) {
        throw new NotFoundException('Đề nghị mua hàng không tồn tại');
      }

      updatedRequest.items = updatedItems;
      return PurchaseRequestMapper.toDomain(updatedRequest);
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequestOrmEntity)
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
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const itemRepository = manager.getRepository(
        PurchaseRequestItemOrmEntity,
      );
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

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
  }

  async submit(id: number, userId: number): Promise<PurchaseRequestEntity> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequestOrmEntity)
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
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

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

      return PurchaseRequestMapper.toDomain(updated!);
    });
  }

  async approve(id: number, userId: number): Promise<PurchaseRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

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

      return PurchaseRequestMapper.toDomain(updated!);
    });
  }

  async reject(
    id: number,
    reason: string,
    userId: number,
  ): Promise<PurchaseRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const prRepository = manager.getRepository(PurchaseRequestOrmEntity);
      const historyRepository = manager.getRepository(
        PurchaseRequestHistoryOrmEntity,
      );

      const rejectedAt = new Date();

      await prRepository.update(id, {
        status: PurchaseRequestStatus.REJECTED,
        rejectedAt,
        rejectReason: reason.trim(),
        updatedById: userId,
      });

      const history = historyRepository.create({
        purchaseRequestId: id,
        fromStatus: PurchaseRequestStatus.PENDING_APPROVAL,
        toStatus: PurchaseRequestStatus.REJECTED,
        action: PurchaseRequestAction.REJECT,
        reason: reason.trim(),
        changedById: userId,
      });

      await historyRepository.save(history);

      const updated = await prRepository.findOne({
        where: { id },
        relations: { items: true },
      });

      return PurchaseRequestMapper.toDomain(updated!);
    });
  }

  async findAll(
    query: PurchaseRequestQueryFilter = {
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
    },
  ): Promise<PaginatedResult<PurchaseRequestEntity>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const where: FindOptionsWhere<PurchaseRequestOrmEntity> = {};

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
      .getRepository(PurchaseRequestOrmEntity)
      .findAndCount({
        where,
        relations: { items: true, department: true },
        skip,
        take: safeLimit,
        order: {
          createdAt: query.sortOrder ?? 'DESC',
        },
      });

    return {
      data: data.map((item) => PurchaseRequestMapper.toDomain(item)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async findOne(id: number): Promise<PurchaseRequestEntity | null> {
    const purchaseRequest = await this.dataSource
      .getRepository(PurchaseRequestOrmEntity)
      .findOne({
        where: { id },
        relations: { items: true, department: true },
      });

    return purchaseRequest
      ? PurchaseRequestMapper.toDomain(purchaseRequest)
      : null;
  }

  async getHistory(id: number): Promise<PurchaseRequestHistoryEntity[]> {
    const existing = await this.dataSource
      .getRepository(PurchaseRequestOrmEntity)
      .findOne({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException('Đề nghị mua hàng không tồn tại');
    }

    const histories = await this.dataSource
      .getRepository(PurchaseRequestHistoryOrmEntity)
      .find({
        where: { purchaseRequestId: id },
        order: { changedAt: 'ASC' },
      });

    return histories.map((h) => PurchaseRequestMapper.toDomainHistory(h));
  }
}
