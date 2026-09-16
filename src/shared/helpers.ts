import { QueryFailedError } from 'typeorm';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

export const generateRandomFilename = (filename: string) => {
  const ext = path.extname(filename);
  return `${uuidv4()}${ext}`;
};
