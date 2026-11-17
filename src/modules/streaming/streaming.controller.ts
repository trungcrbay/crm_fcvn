// src/streaming/streaming.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StreamingService } from './streaming.service';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/shared/decorator/public.decorator';
@Public()
@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}
  // streaming.controller.ts
  @Throttle({ default: { limit: 333333, ttl: 60000 } })
  @Get('large-dataset')
  async streamLargeDataset(@Res() response: Response) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('X-Accel-Buffering', 'no'); // tắt buffer của nginx
    response.flushHeaders();

    response.write('[');
    try {
      await this.streamingService.streamData(response);
      response.write(']');
      response.end();
    } catch (error) {
      response.destroy(error as Error); // báo lỗi thật cho client
    }
  }
}

//câu lệnh check streaming response: curl.exe -N http://localhost:8003/v1/streaming/large-dataset
