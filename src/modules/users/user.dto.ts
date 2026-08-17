import { createZodDto } from 'nestjs-zod';
import {
  CreateUserBodySchema,
  GetUsersQuerySchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
} from './user.model';

export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class CreateUserBodyDTO extends createZodDto(CreateUserBodySchema) {}

export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}
