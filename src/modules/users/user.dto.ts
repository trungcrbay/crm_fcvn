import { createZodDto } from 'nestjs-zod';
import {
  CreateUserBodySchema,
  GetUsersQuerySchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
  UserDetailSchema,
  UserPublicSchema,
} from './user.model';

export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class CreateUserBodyDTO extends createZodDto(CreateUserBodySchema) {}

export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}
export class UserPublicDTO extends createZodDto(UserPublicSchema) {}
export class UserDetailDTO extends createZodDto(UserDetailSchema) {}
