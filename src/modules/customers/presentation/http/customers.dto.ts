import { createZodDto } from 'nestjs-zod';
import {
  CreateCustomerBodySchema,
  GetCustomersQuerySchema,
  GetCustomersResSchema,
  UpdateCustomerBodySchema,
} from './customers.model';

export class GetCustomersResDTO extends createZodDto(GetCustomersResSchema) {}

export class GetCustomersQueryDTO extends createZodDto(
  GetCustomersQuerySchema,
) {}

export class CreateCustomerBodyDTO extends createZodDto(
  CreateCustomerBodySchema,
) {}

export class UpdateCustomerBodyDTO extends createZodDto(
  UpdateCustomerBodySchema,
) {}

// export class CreateCustomerResDTO extends UpdateProfileResDTO {}
