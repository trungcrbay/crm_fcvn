import { createZodDto } from 'nestjs-zod';
import {
  CreateCustomerRequestBodySchema,
  CustomerRequestSchema,
  GetCustomerRequestsQuerySchema,
  GetCustomerRequestsResSchema,
  GetDetailCustomerRequestsResSchema,
  RejectCustomerRequestBodySchema,
} from './customer-request.model';

export class CreateCustomerRequestBodyDTO extends createZodDto(
  CreateCustomerRequestBodySchema,
) {}

export class RejectCustomerRequestBodyDTO extends createZodDto(
  RejectCustomerRequestBodySchema,
) {}

export class CustomerRequestResDTO extends createZodDto(
  CustomerRequestSchema,
) {}

export class GetCustomerRequestsQueryDTO extends createZodDto(
  GetCustomerRequestsQuerySchema,
) {}

export class GetCustomerRequestsResDTO extends createZodDto(
  GetCustomerRequestsResSchema,
) {}
export class GetDetailCustomerRequestsResDTO extends createZodDto(
  GetDetailCustomerRequestsResSchema,
) {}
