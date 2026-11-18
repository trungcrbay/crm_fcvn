import { StreamingService } from './streaming.service';
import { PipeStreamingService } from './pipe-streaming.service';
import { CompressionService } from './compression.service';
import { Readable } from 'stream';
import { EventEmitter } from 'events';

class MockResponse extends EventEmitter {
  statusCode = 200;
  headers: Record<string, string> = {};
  chunks: string[] = [];
  headersSent = false;
  destroyed = false;

  setHeader(key: string, value: string) {
    this.headers[key.toLowerCase()] = value;
  }

  flushHeaders() {
    this.headersSent = true;
  }

  write(chunk: any): boolean {
    this.chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());
    return true;
  }

  end() {
    this.emit('finish');
    return this;
  }

  destroy(err?: Error) {
    this.destroyed = true;
    this.emit('error', err);
    return this;
  }
}

describe('Streaming Module Services', () => {
  let streamingService: StreamingService;
  let pipeStreamingService: PipeStreamingService;
  let compressionService: CompressionService;

  beforeEach(() => {
    streamingService = new StreamingService();
    pipeStreamingService = new PipeStreamingService();
    compressionService = new CompressionService(pipeStreamingService);
  });

  describe('StreamingService', () => {
    it('should generate expected number of records with getDataGenerator', async () => {
      const records: any[] = [];
      for await (const record of streamingService.getDataGenerator(50, 20)) {
        records.push(record);
      }

      expect(records.length).toBe(50);
      expect(records[0]).toMatchObject({
        id: 1,
        name: 'Record 1',
        processed: true,
      });
    });

    it('should abort generation when signal is aborted', async () => {
      const controller = new AbortController();
      const records: any[] = [];

      const generator = streamingService.getDataGenerator(
        100,
        10,
        controller.signal,
      );

      for await (const record of generator) {
        records.push(record);
        if (records.length === 15) {
          controller.abort();
        }
      }

      expect(records.length).toBeLessThan(30);
    });

    it('should return a readable stream from getDataStream', async () => {
      const stream = streamingService.getDataStream(10, 5);
      expect(stream).toBeInstanceOf(Readable);

      const items: any[] = [];
      for await (const item of stream) {
        items.push(item);
      }

      expect(items.length).toBe(10);
    });
  });

  describe('PipeStreamingService', () => {
    it('should stream data as NDJSON', async () => {
      const res = new MockResponse() as any;
      const source = Readable.from([{ id: 1 }, { id: 2 }]);

      await pipeStreamingService.streamNdjson(res, source);

      const output = res.chunks.join('');
      const lines = output.trim().split('\n');

      expect(res.headers['content-type']).toContain('application/x-ndjson');
      expect(lines.length).toBe(2);
      expect(JSON.parse(lines[0])).toEqual({ id: 1 });
      expect(JSON.parse(lines[1])).toEqual({ id: 2 });
    });

    it('should stream data as JSON Array', async () => {
      const res = new MockResponse() as any;
      const source = Readable.from([{ id: 1 }, { id: 2 }]);

      await pipeStreamingService.streamJsonArray(res, source);

      const output = res.chunks.join('');
      const parsed = JSON.parse(output);

      expect(res.headers['content-type']).toContain('application/json');
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should stream empty JSON Array if source is empty', async () => {
      const res = new MockResponse() as any;
      const source = Readable.from([]);

      await pipeStreamingService.streamJsonArray(res, source);

      const output = res.chunks.join('');
      expect(output).toBe('[]');
    });
  });

  describe('CompressionService', () => {
    it('should set gzip headers and stream compressed NDJSON', async () => {
      const res = new MockResponse() as any;
      const source = Readable.from([{ id: 1 }, { id: 2 }]);

      await compressionService.streamCompressedNdjson(res, source);

      expect(res.headers['content-encoding']).toBe('gzip');
      expect(res.headers['content-type']).toContain('application/x-ndjson');
      expect(res.chunks.length).toBeGreaterThan(0);
    });
  });
});

