import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../domain/customers.repository.interface';

import { isUniqueConstraintError } from '../../../../shared/helpers';
import { UpdateCustomerBodyDTO } from '../customers.dto';
import { CustomerEntity } from '../../domain/customers.entity';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateCustomerBodyDTO,
    userId: number,
  ): Promise<CustomerEntity> {
    try {
      const updated = await this.customersRepository.update(id, {
        ...dto,
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
