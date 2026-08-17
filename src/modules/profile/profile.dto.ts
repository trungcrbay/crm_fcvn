import { createZodDto } from 'nestjs-zod';
import { GetUserProfileResSchema } from './profile.model';

export class GetUserProfileResDTO extends createZodDto(
  GetUserProfileResSchema,
) {}
