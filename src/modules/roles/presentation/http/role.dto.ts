import { createZodDto } from 'nestjs-zod';
import {
  CreateRoleBodySchema,
  GetRolesQuerySchema,
  GetRolesResSchema,
  UpdateRoleBodySchema,
} from './role.model';

export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}

export class GetRolesQueryDTO extends createZodDto(GetRolesQuerySchema) {}

export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
