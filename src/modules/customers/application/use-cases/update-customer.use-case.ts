import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  CustomerEntity,
  type ICustomersRepository,
} from '../../domain';

import { isUniqueConstraintError } from '../../../../shared/helpers';
import { UpdateCustomerCommand } from '../commands/customer.commands';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    id: string,
    command: UpdateCustomerCommand,
    userId: number,
  ): Promise<CustomerEntity> {
    try {
      const updated = await this.customersRepository.update(id, {
        ...command,
        updatedById: userId,
      });

      if (!updated) {
        throw new NotFoundException(`Không tìm thấy khách hàng với id: ${id}`);
      }

      return updated;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Mã hoặc email khách hàng đã tồn tại');
      }
      throw error;
    }
  }
}
