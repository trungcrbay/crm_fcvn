import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

const CustomZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    if (!(error instanceof ZodError)) {
      return new UnprocessableEntityException('Validation failed');
    }

    return new UnprocessableEntityException(
      error.issues.map((issue) => ({
        ...issue,
        path: issue.path.join('.'),
      })),
    );
  },
});

export default CustomZodValidationPipe;
