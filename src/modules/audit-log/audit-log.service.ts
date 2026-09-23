import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLog, FieldDiff } from './audit-log.entity';
import { AuditLogModel } from './audit-log.constant';

export interface CreateAuditLogParams {
  actionById: number;
  refModel: AuditLogModel;
  targetId?: number;
  diffs?: FieldDiff[];
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditLogService.name);
  }

  async log(
    params: CreateAuditLogParams,
    entityManager?: EntityManager,
  ): Promise<AuditLog> {
    const payload = {
      actionById: params.actionById,
      refModel: params.refModel,
      targetId: params.targetId,
      diffs: params.diffs ?? [],
      metadata: params.metadata ?? {},
      createdById: params.actionById,
      updatedById: params.actionById,
    };

    let savedLog: AuditLog;

    if (entityManager) {
      const repo = entityManager.getRepository(AuditLog);
      const entity = repo.create(payload);
      savedLog = await repo.save(entity);
    } else {
      savedLog = await this.auditLogRepository.create(payload);
    }

    return savedLog;
  }

  computeDiffs(
    oldObj: Record<string, any> | null | undefined,
    newObj: Record<string, any> | null | undefined,
    ignoredFields: string[] = [
      'createdAt',
      'createdById',
      'updatedAt',
      'updatedById',
      'deletedAt',
      'deletedById',
    ],
  ): FieldDiff[] {
    if (!oldObj || !newObj) {
      return [];
    }

    const diffs: FieldDiff[] = [];
    const ignoredSet = new Set(ignoredFields);
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      if (ignoredSet.has(key)) {
        continue;
      }

      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (typeof oldValue === 'function' || typeof newValue === 'function') {
        continue;
      }

      const isDifferent =
        JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null);

      if (isDifferent) {
        diffs.push({
          field: key,
          oldValue: oldValue ?? null,
          newValue: newValue ?? null,
        });
      }
    }

    return diffs;
  }
}
