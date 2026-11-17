// src/streaming/compression.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class CompressionService {
  /**
   * Stream data -> gzip -> HTTP response, all without buffering
   * the full payload in memory.
   */
  async streamWithCompression(
    response: Response,
    source: Readable,
  ): Promise<void> {
    // Tell the client the body is gzip-encoded
    response.setHeader('Content-Encoding', 'gzip');
    response.setHeader('Content-Type', 'application/x-ndjson');

    const gzip = createGzip();

    // Chain: source --> gzip transform --> response
    // pipeline wires backpressure across all three stages
    await pipeline(source, gzip, response);
  }
}
