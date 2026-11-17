// src/streaming/pipe-streaming.service.ts
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class PipeStreamingService {
  /**
   * Pipe a Readable source straight into the HTTP response.
   * pipeline() handles backpressure AND cleans up on error.
   */
  async streamSource(response: Response, source: Readable): Promise<void> {
    response.setHeader('Content-Type', 'application/x-ndjson');
    response.setHeader('Transfer-Encoding', 'chunked');

    // One line of JSON per record (NDJSON) - no bracket/comma juggling
    const toNdjson = new Readable({ objectMode: true });

    try {
      // pipeline resolves when the whole stream is flushed, or rejects on error
      await pipeline(source, response);
    } catch (error) {
      // pipeline already destroyed the streams for us; just log
      console.error('Streaming pipeline failed:', error);
      throw error;
    }
  }
}
