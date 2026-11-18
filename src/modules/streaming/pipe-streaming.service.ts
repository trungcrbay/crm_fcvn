// src/modules/streaming/pipe-streaming.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class PipeStreamingService {
  private readonly logger = new Logger(PipeStreamingService.name);

  /**
   * Thiết lập header tối ưu cho HTTP Chunked Streaming
   */
  setStreamingHeaders(response: Response, contentType: string): void {
    response.setHeader('Content-Type', contentType);
    response.setHeader('Transfer-Encoding', 'chunked');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Tắt buffer của Nginx / Reverse Proxy
    response.flushHeaders();
  }

  /**
   * Tạo Transform Stream chuyển đổi các Object thành dòng NDJSON (Newline Delimited JSON)
   */
  createNdjsonTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk, _encoding, callback) {
        try {
          const line =
            typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          callback(null, line + '\n');
        } catch (error) {
          callback(error as Error);
        }
      },
    });
  }

  /**
   * Tạo Transform Stream đóng gói các Object thành mảng JSON chuẩn: [ {..}, {..} ]
   */
  createJsonArrayTransform(): Transform {
    let isFirst = true;

    return new Transform({
      objectMode: true,
      transform(chunk, _encoding, callback) {
        try {
          const prefix = isFirst ? '[\n' : ',\n';
          isFirst = false;
          const serialized =
            typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          callback(null, prefix + serialized);
        } catch (error) {
          callback(error as Error);
        }
      },
      flush(callback) {
        if (isFirst) {
          callback(null, '[]');
        } else {
          callback(null, '\n]');
        }
      },
    });
  }

  /**
   * Stream dữ liệu dưới dạng NDJSON (mỗi record là 1 dòng JSON)
   * Tối ưu bộ nhớ, không cần ghép ngoặc vuông hay dấu phẩy
   */
  async streamNdjson(
    response: Response,
    source: Readable | AsyncIterable<any>,
  ): Promise<void> {
    this.setStreamingHeaders(response, 'application/x-ndjson; charset=utf-8');

    const readable =
      source instanceof Readable ? source : Readable.from(source);
    const transform = this.createNdjsonTransform();

    try {
      await pipeline(readable, transform, response);
    } catch (error) {
      this.logger.error('Streaming NDJSON pipeline failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }

  /**
   * Stream dữ liệu dưới dạng mảng JSON chuẩn [ {...}, {...} ]
   * Client có thể parse như một mảng JSON thông thường
   */
  async streamJsonArray(
    response: Response,
    source: Readable | AsyncIterable<any>,
  ): Promise<void> {
    this.setStreamingHeaders(response, 'application/json; charset=utf-8');

    const readable =
      source instanceof Readable ? source : Readable.from(source);
    const transform = this.createJsonArrayTransform();

    try {
      await pipeline(readable, transform, response);
    } catch (error) {
      this.logger.error('Streaming JSON Array pipeline failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }

  /**
   * Pipe một Readable Stream thô (text hoặc binary) thẳng vào HTTP Response
   */
  async streamRaw(
    response: Response,
    source: Readable,
    contentType = 'application/octet-stream',
  ): Promise<void> {
    this.setStreamingHeaders(response, contentType);

    try {
      await pipeline(source, response);
    } catch (error) {
      this.logger.error('Streaming raw source pipeline failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }
}
