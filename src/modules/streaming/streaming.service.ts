// src/modules/streaming/streaming.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { once } from 'events';
import { Readable } from 'stream';
import { setTimeout as sleep } from 'timers/promises';

export interface StreamRecord {
  id: number;
  name: string;
  value: number;
  processed: boolean;
  createdAt: string;
}

@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private readonly DEFAULT_BATCH_SIZE = 1000;
  private readonly DEFAULT_TOTAL_RECORDS = 10000;

  /**
   * Async Generator sinh dữ liệu theo từng record hoặc batch.
   * Khi client ngắt kết nối (signal.aborted), generator sẽ dừng ngay lập tức,
   * tránh lãng phí RAM và tài nguyên CPU/Database của server.
   */
  async *getDataGenerator(
    limitTotal = this.DEFAULT_TOTAL_RECORDS,
    batchSize = this.DEFAULT_BATCH_SIZE,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamRecord, void, unknown> {
    let offset = 0;

    while (offset < limitTotal) {
      if (signal?.aborted) {
        this.logger.warn(
          `Client disconnected. Aborting data generation at offset ${offset}.`,
        );
        return;
      }

      const currentLimit = Math.min(batchSize, limitTotal - offset);
      const batch = await this.fetchDataBatch(offset, currentLimit);

      if (batch.length === 0) break;

      for (const record of batch) {
        if (signal?.aborted) return;
        yield this.transformRecord(record);
      }

      offset += batch.length;
    }
  }

  /**
   * Tạo một Readable Stream (objectMode) từ Async Generator
   */
  getDataStream(
    limitTotal = this.DEFAULT_TOTAL_RECORDS,
    batchSize = this.DEFAULT_BATCH_SIZE,
    signal?: AbortSignal,
  ): Readable {
    return Readable.from(this.getDataGenerator(limitTotal, batchSize, signal), {
      objectMode: true,
    });
  }

  /**
   * Phương thức stream thủ công với cơ chế kiểm soát Backpressure qua 'drain'.
   * Giữ lại để đảm bảo tương thích ngược và phục vụ benchmark so sánh.
   */
  async streamData(
    res: Response,
    limitTotal = this.DEFAULT_TOTAL_RECORDS,
  ): Promise<void> {
    let isFirst = true;
    let offset = 0;

    while (!res.destroyed && offset < limitTotal) {
      const currentLimit = Math.min(
        this.DEFAULT_BATCH_SIZE,
        limitTotal - offset,
      );
      const batch = await this.fetchDataBatch(offset, currentLimit);
      if (batch.length === 0) break;

      // Gom batch thành 1 chunk để giảm số lần gọi syscall I/O
      let chunk = '';
      for (const record of batch) {
        chunk +=
          (isFirst ? '' : ',') + JSON.stringify(this.transformRecord(record));
        isFirst = false;
      }

      await this.write(res, chunk);
      (res as any).flush?.();
      offset += batch.length;
    }
  }

  private async write(res: Response, chunk: string): Promise<void> {
    if (!res.write(chunk)) {
      await once(res, 'drain');
    }
  }

  private async fetchDataBatch(offset: number, limit: number): Promise<any[]> {
    await sleep(200); // Giả lập độ trễ truy vấn I/O hoặc Database
    const batch: any[] = [];
    for (let i = 0; i < limit; i++) {
      batch.push({
        id: offset + i + 1,
        name: `Record ${offset + i + 1}`,
        value: Math.round(Math.random() * 10000) / 100,
      });
    }
    return batch;
  }

  private transformRecord(record: any): StreamRecord {
    return {
      ...record,
      processed: true,
      createdAt: new Date().toISOString(),
    };
  }
}
