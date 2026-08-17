import { QueryFailedError } from 'typeorm';

type PostgresDriverError = {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
};

function getPostgresError(error: unknown): PostgresDriverError | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  return error.driverError as PostgresDriverError;
}

export function isPostgresError(error: unknown, code: string): boolean {
  return getPostgresError(error)?.code === code;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return isPostgresError(error, '23505');
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return isPostgresError(error, '23503');
}

export function isNotNullConstraintError(error: unknown): boolean {
  return isPostgresError(error, '23502');
}
