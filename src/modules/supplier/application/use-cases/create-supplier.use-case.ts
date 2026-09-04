import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUniqueConstraintError } from 'src/shared/helpers';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
  SupplierEntity,
} from '../../domain';
import { CreateSupplierCommand } from '../commands/supplier.commands';

@Injectable()
export class CreateSupplierUseCase {
  constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  async execute(
    command: CreateSupplierCommand,
    userId: number,
  ): Promise<SupplierEntity> {
    const { supplierCode, name, email, phone, address, supplierGroupId } =
      command;

    try {
      return await this.suppliersRepository.create({
        supplierCode: supplierCode?.trim(),
        name: name?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        address: address?.trim(),
        supplierGroupId,
        createdById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email nhà cung cấp đã tồn tại');
      }
      throw error;
    }
  }
}
