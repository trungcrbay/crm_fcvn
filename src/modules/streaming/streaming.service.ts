// streaming.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { once } from 'events';
import { setTimeout as sleep } from 'timers/promises';

@Injectable()
export class StreamingService {
  private readonly BATCH_SIZE = 1000;

  private async write(res: Response, chunk: string): Promise<void> {
    if (!res.write(chunk)) {
      await once(res, 'drain');
    }
  }

  async streamData(res: Response): Promise<void> {
    let isFirst = true;
    let offset = 0;

    while (!res.destroyed) {
      const batch = await this.fetchDataBatch(offset, this.BATCH_SIZE);
      if (batch.length === 0) break;

      // Gom cả batch thành 1 chunk -> ít syscall hơn
      let chunk = '';
      for (const record of batch) {
        chunk +=
          (isFirst ? '' : ',') + JSON.stringify(this.transformRecord(record));
        isFirst = false;
      }

      await this.write(res, chunk);
      (res as any).flush?.(); // nếu dùng compression
      offset += this.BATCH_SIZE;
    }
  }

  private async fetchDataBatch(offset: number, limit: number): Promise<any[]> {
    await sleep(300); // giả lập độ trễ DB để thấy rõ stream
    if (offset >= 10000) return [];
    const batch: any[] = [];
    for (let i = 0; i < limit && offset + i < 10000; i++) {
      batch.push({
        id: offset + i + 1,
        name: `Record ${offset + i + 1}`,
        value: Math.random() * 1000,
      });
    }
    return batch;
  }

  private transformRecord(record: any) {
    return { ...record, processed: true };
  }
}
