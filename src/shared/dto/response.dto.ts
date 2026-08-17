import { createZodDto } from 'nestjs-zod';
import { MessageResSchema } from '../model/response.model';

export class MessageResDTO extends createZodDto(MessageResSchema) {}
