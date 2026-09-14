import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

const CustomZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    if (!(error instanceof ZodError)) {
      return new UnprocessableEntityException('Validation failed');
    }

    return new UnprocessableEntityException(
      error.issues.map((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return {
            field: issue.keys.join(', '),
            message: `Tham số không được hỗ trợ: ${issue.keys.join(', ')}`,
          };
        }

        return {
          field: issue.path.join('.'),
          message: issue.message,
        };
      }),
    );
  },
});

export default CustomZodValidationPipe;
