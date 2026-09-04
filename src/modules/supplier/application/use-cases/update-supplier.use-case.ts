import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
  SupplierEntity,
} from '../../domain';
import { UpdateSupplierCommand } from '../commands/supplier.commands';

@Injectable()
export class UpdateSupplierUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(
    id: number,
    command: UpdateSupplierCommand,
    userId: number,
  ): Promise<SupplierEntity> {
    try {
      const supplier = await this.suppliersRepository.update(id, {
        supplierCode: command.supplierCode?.trim(),
        name: command.name?.trim(),
        email: command.email?.trim().toLowerCase(),
        phone: command.phone?.trim(),
        address: command.address?.trim(),
        supplierGroupId: command.supplierGroupId,
        status: command.status,
        updatedById: userId,
      });

      if (!supplier) {
        throw new NotFoundException('Không tìm thấy nhà cung cấp');
      }

      return supplier;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email nhà cung cấp đã tồn tại');
      }
      throw error;
    }
  }
}
