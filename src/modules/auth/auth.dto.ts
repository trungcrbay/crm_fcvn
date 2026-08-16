import { createZodDto } from 'nestjs-zod';
import { LoginBodySchema, LoginResSchema } from './auth.model';

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResDTO extends createZodDto(LoginResSchema) {}
