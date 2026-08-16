import { createZodDto } from 'nestjs-zod';
import {
  LoginBodySchema,
  RegisterBodySchema,
  RegisterResSchema,
  LoginResSchema,
} from './auth.model';

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResDTO extends createZodDto(LoginResSchema) {}
