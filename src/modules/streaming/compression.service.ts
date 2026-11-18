// src/modules/streaming/compression.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { createGzip, constants as zlibConstants, ZlibOptions } from 'zlib';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { PipeStreamingService } from './pipe-streaming.service';

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name);

  constructor(private readonly pipeStreamingService: PipeStreamingService) {}

  /**
   * Tạo instance Gzip tối ưu cho HTTP Live Streaming:
   * Dùng Z_SYNC_FLUSH để xả nén ngay lập tức từng chunk mà không đợi đầy buffer 16KB-32KB.
   */
  createStreamingGzip(customOptions?: ZlibOptions) {
    return createGzip({
      level: zlibConstants.Z_DEFAULT_COMPRESSION,
      flush: zlibConstants.Z_SYNC_FLUSH,
      ...customOptions,
    });
  }

  /**
   * Stream dữ liệu Object -> NDJSON -> Gzip nén trực tiếp -> HTTP Response.
   * Giảm 70-90% dung lượng truyền tải trên mạng.
   */
  async streamCompressedNdjson(
    response: Response,
    source: Readable | AsyncIterable<any>,
    gzipOptions?: ZlibOptions,
  ): Promise<void> {
    response.setHeader('Content-Encoding', 'gzip');
    response.setHeader('Vary', 'Accept-Encoding');
    this.pipeStreamingService.setStreamingHeaders(
      response,
      'application/x-ndjson; charset=utf-8',
    );

    const readable =
      source instanceof Readable ? source : Readable.from(source);
    const ndjsonTransform = this.pipeStreamingService.createNdjsonTransform();
    const gzip = this.createStreamingGzip(gzipOptions);

    try {
      await pipeline(readable, ndjsonTransform, gzip, response);
    } catch (error) {
      this.logger.error('Compressed NDJSON streaming failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Compression streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }

  /**
   * Stream dữ liệu Object -> Mảng JSON [ {..}, {..} ] -> Gzip nén trực tiếp -> HTTP Response.
   */
  async streamCompressedJsonArray(
    response: Response,
    source: Readable | AsyncIterable<any>,
    gzipOptions?: ZlibOptions,
  ): Promise<void> {
    response.setHeader('Content-Encoding', 'gzip');
    response.setHeader('Vary', 'Accept-Encoding');
    this.pipeStreamingService.setStreamingHeaders(
      response,
      'application/json; charset=utf-8',
    );

    const readable =
      source instanceof Readable ? source : Readable.from(source);
    const jsonArrayTransform =
      this.pipeStreamingService.createJsonArrayTransform();
    const gzip = this.createStreamingGzip(gzipOptions);

    try {
      await pipeline(readable, jsonArrayTransform, gzip, response);
    } catch (error) {
      this.logger.error('Compressed JSON Array streaming failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Compression streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }

  /**
   * Nén trực tiếp một Readable stream thô (text/binary) rồi truyền tới HTTP Response.
   */
  async streamRawGzip(
    response: Response,
    source: Readable,
    contentType = 'application/octet-stream',
    gzipOptions?: ZlibOptions,
  ): Promise<void> {
    response.setHeader('Content-Encoding', 'gzip');
    response.setHeader('Vary', 'Accept-Encoding');
    this.pipeStreamingService.setStreamingHeaders(response, contentType);

    const gzip = this.createStreamingGzip(gzipOptions);

    try {
      await pipeline(source, gzip, response);
    } catch (error) {
      this.logger.error('Raw gzip streaming failed:', error);
      if (!response.headersSent) {
        response
          .status(500)
          .json({ statusCode: 500, message: 'Compression streaming failed' });
      } else {
        response.destroy(error as Error);
      }
    }
  }
}
